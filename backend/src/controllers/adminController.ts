import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

// Fetch all users with their sessions
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().select('-password -twoFactorSecret -emailVerificationOtp -resetPasswordOtp').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// Delete a user entirely
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (id === req.user!.id) {
      return next(new AppError('You cannot delete yourself', 400));
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return next(new AppError('User not found', 404));

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Forcibly revoke a specific session for a specific user
export const revokeUserSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, tokenId } = req.params;

    const user = await User.findById(userId);
    if (!user) return next(new AppError('User not found', 404));

    user.sessions = user.sessions.filter(s => s.token !== tokenId);
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (err) {
    next(err);
  }
};
