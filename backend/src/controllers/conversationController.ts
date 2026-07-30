import { Request, Response, NextFunction } from 'express';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { AppError } from '../middleware/errorHandler';

export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversations = await Conversation.find({ userId: req.user!.id })
      .sort({ updatedAt: -1 })
      .limit(100);

    res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
};

export const getConversationWithMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({ _id: id, userId: req.user!.id });

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 });

    res.json({ success: true, conversation, messages });
  } catch (err) {
    next(err);
  }
};

export const updateConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, userId: req.user!.id },
      { title },
      { new: true, runValidators: true }
    );

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    res.json({ success: true, conversation });
  } catch (err) {
    next(err);
  }
};

export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOneAndDelete({ _id: id, userId: req.user!.id });

    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    await Message.deleteMany({ conversationId: id });

    res.json({ success: true, message: 'Conversation and messages deleted' });
  } catch (err) {
    next(err);
  }
};

export const deleteAllConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Find all conversations to get their IDs
    const conversations = await Conversation.find({ userId });
    const convIds = conversations.map(c => c._id);
    
    // Delete all messages associated with those conversations
    await Message.deleteMany({ conversationId: { $in: convIds } });
    
    // Delete all conversations for the user
    await Conversation.deleteMany({ userId });
    
    res.json({ success: true, message: 'All conversations and messages deleted' });
  } catch (err) {
    next(err);
  }
};
