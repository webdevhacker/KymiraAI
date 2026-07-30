import { Request, Response, NextFunction } from 'express';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { sendProfilePasswordChangeOtp } from '../services/emailService';

// ─── Profile Management ───────────────────────────────────────────────────────

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user!.id);
    
    if (!user) return next(new AppError('User not found', 404));

    if (name) user.name = name;

    await user.save();
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
};

export const requestPasswordChange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    const otp = crypto.randomInt(100000, 999999).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save({ validateBeforeSave: false });

    await sendProfilePasswordChangeOtp(user.email, otp);

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    next(err);
  }
};

export const verifyPasswordChange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) return next(new AppError('OTP and new password are required', 400));
    if (newPassword.length < 6) return next(new AppError('Password must be at least 6 characters', 400));

    // Get user with password selected so we can compare
    const user = await User.findById(req.user!.id).select('+password');
    if (!user) return next(new AppError('User not found', 404));

    if (!user.resetPasswordOtp || !user.resetPasswordExpires) {
      return next(new AppError('No OTP request found. Please request a new OTP.', 400));
    }

    if (user.resetPasswordOtp !== otp) {
      return next(new AppError('Invalid OTP', 400));
    }

    if (user.resetPasswordExpires.getTime() < Date.now()) {
      return next(new AppError('OTP has expired', 400));
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return next(new AppError('New password cannot be the same as your old password', 400));
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    user.sessions = []; // Revoke all active sessions on password change
    await user.save();

    res.json({ success: true, message: 'Password updated successfully. Other sessions have been revoked.' });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    res.json({ success: true, user, sessions: user.sessions });
  } catch (err) {
    next(err);
  }
};

// ─── Terms & Privacy ──────────────────────────────────────────────────────────

export const acceptTerms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.user!.id, { hasAcceptedTerms: true }, { new: true });
    res.json({ success: true, hasAcceptedTerms: user?.hasAcceptedTerms });
  } catch (err) {
    next(err);
  }
};

// ─── Session Management ───────────────────────────────────────────────────────

export const revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tokenId } = req.params;
    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    user.sessions = user.sessions.filter(s => s.token !== tokenId);
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, sessions: user.sessions });
  } catch (err) {
    next(err);
  }
};

// ─── Two-Factor Authentication ────────────────────────────────────────────────

export const generate2FA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    const secret = authenticator.generateSecret();
    user.twoFactorSecret = secret;
    await user.save({ validateBeforeSave: false });

    const otpauthUrl = authenticator.keyuri(user.email, 'KymiraAI', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({ success: true, secret, qrCodeUrl });
  } catch (err) {
    next(err);
  }
};

export const verifyAndEnable2FA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) return next(new AppError('Code required', 400));

    const user = await User.findById(req.user!.id).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) return next(new AppError('Setup 2FA first', 400));

    const isValid = authenticator.check(code, user.twoFactorSecret);
    if (!isValid) return next(new AppError('Invalid code', 400));

    user.isTwoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: '2FA Enabled successfully' });
  } catch (err) {
    next(err);
  }
};

export const disable2FA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) return next(new AppError('Code required', 400));

    const user = await User.findById(req.user!.id).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) return next(new AppError('2FA is not enabled', 400));

    const isValid = authenticator.check(code, user.twoFactorSecret);
    if (!isValid) return next(new AppError('Invalid code', 400));

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: '2FA Disabled successfully' });
  } catch (err) {
    next(err);
  }
};
