import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import OpenAI from 'openai';
import { streamChat, generateImageDirectly } from '../services/openaiService';
import { getMemories, extractAndStoreMemories } from '../services/memoryService';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { AppError } from '../middleware/errorHandler';

export const streamChatHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { message, conversationId, model = 'openrouter/free', enableWebSearch = 'false' } = req.body;
  const userId = req.user!.id;
  const useWebSearch = enableWebSearch === 'true' || enableWebSearch === true;
  
  // Clean up legacy models
  let aiModel = (model as string) || 'openrouter/free';
  if (!aiModel.includes('/') && aiModel !== 'openrouter/free') {
    aiModel = 'openrouter/free';
  }

  if (!message && !req.file) {
    next(new AppError('Message or file is required', 400));
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendSSE = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    let convId = conversationId as string | undefined;

    if (!convId) {
      const conv = await Conversation.create({
        userId,
        title: (message || 'New Chat').substring(0, 60),
        aiModel,
        enableWebSearch: useWebSearch,
      });
      convId = conv.id as string;
      sendSSE({ type: 'conversation_id', conversationId: convId });
    } else {
      const exists = await Conversation.findOne({ _id: convId, userId });
      if (!exists) {
        sendSSE({ type: 'error', message: 'Conversation not found' });
        res.end();
        return;
      }
    }

    const history = await Message.find({ conversationId: convId }).sort({ createdAt: 1 }).limit(30);

    const messages: OpenAI.ChatCompletionMessageParam[] = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    let userContent: string | OpenAI.ChatCompletionContentPart[] = (message as string) || '';
    let fileAttachment: { type: string; url: string; name: string } | undefined;

    if (req.file) {
      const { file } = req;
      const isImage = file.mimetype.startsWith('image/');

      if (isImage) {
        const imgBuffer = fs.readFileSync(file.path);
        const base64 = imgBuffer.toString('base64');
        userContent = [
          { type: 'text', text: message || 'Please analyze this image.' },
          { type: 'image_url', image_url: { url: `data:${file.mimetype};base64,${base64}` } },
        ];
        fileAttachment = { type: 'image', url: `/uploads/${file.filename}`, name: file.originalname };
      } else {
        const fileContent = fs.readFileSync(file.path, 'utf-8');
        userContent = `${message || 'Please analyze this file.'}\n\n**File: ${file.originalname}**\n\`\`\`\n${fileContent.substring(0, 10000)}\n\`\`\``;
        fileAttachment = { type: 'file', url: `/uploads/${file.filename}`, name: file.originalname };
      }
      try { fs.unlinkSync(file.path); } catch { /* ignore */ }
    }

    messages.push({ role: 'user', content: userContent });

    await Message.create({
      conversationId: convId,
      role: 'user',
      content: message || (req.file ? `[File: ${req.file.originalname}]` : ''),
      attachments: fileAttachment ? [fileAttachment] : [],
    });

    const memories = await getMemories(userId);

    const fullResponse = await streamChat({
      messages,
      model: aiModel,
      enableWebSearch: useWebSearch,
      memories,
      res,
    });

    await Message.create({
      conversationId: convId,
      role: 'assistant',
      content: fullResponse,
    });

    if (history.length === 0 && message) {
      await Conversation.findByIdAndUpdate(convId, {
        title: (message as string).substring(0, 60),
        aiModel,
      });
    }

    if (message && fullResponse) {
      extractAndStoreMemories(userId, message as string, fullResponse).catch(() => {});
    }

    sendSSE({ type: 'done', conversationId: convId });
  } catch (err: any) {
    console.error('Chat stream error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message || 'Stream error' })}\n\n`);
  } finally {
    res.end();
  }
};

export const generateImageHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prompt, size = '1024x1024' } = req.body;
    if (!prompt?.trim()) return next(new AppError('Prompt is required', 400));
    const imageUrl = generateImageDirectly(prompt.trim(), size as string);
    res.json({ success: true, imageUrl, prompt: prompt.trim() });
  } catch (err) {
    next(err);
  }
};
