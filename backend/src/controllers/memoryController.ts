import { Request, Response, NextFunction } from 'express';
import { Memory } from '../models/Memory';
import { AppError } from '../middleware/errorHandler';

export const getMemoriesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const memory = await Memory.findOne({ userId: req.user!.id });
    res.json({ success: true, facts: memory?.facts || [] });
  } catch (err) {
    next(err);
  }
};

export const deleteMemoryFact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const index = parseInt(req.params.index, 10);
    const memory = await Memory.findOne({ userId: req.user!.id });

    if (!memory || memory.facts.length === 0) {
      return next(new AppError('No memories found', 404));
    }

    if (index < 0 || index >= memory.facts.length) {
      return next(new AppError('Invalid memory index', 400));
    }

    memory.facts.splice(index, 1);
    await memory.save();

    res.json({ success: true, facts: memory.facts });
  } catch (err) {
    next(err);
  }
};

export const clearAllMemories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await Memory.findOneAndUpdate({ userId: req.user!.id }, { facts: [] }, { upsert: true });
    res.json({ success: true, message: 'All memories cleared', facts: [] });
  } catch (err) {
    next(err);
  }
};
