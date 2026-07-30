import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import geoip from 'geoip-lite';
import { User, ISession } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { sendVerificationOtp, sendPasswordResetOtp, sendLoginAlert } from '../services/emailService';
import crypto from 'crypto';

const signAccessToken = (userId: string, email: string): string =>
  jwt.sign({ userId, email }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  });

const signRefreshToken = (userId: string, email: string, sessionId: string): string =>
  jwt.sign({ userId, email, sessionId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
  });

const signTempToken = (userId: string): string =>
  jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '5m' as any });

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress;
  return ip === '::1' ? '127.0.0.1' : (ip || '127.0.0.1');
};

const getLocation = (ip: string): string => {
  if (ip === '127.0.0.1' || ip.startsWith('192.168.')) return 'Localhost / LAN';
  const geo = geoip.lookup(ip);
  if (geo) return `${geo.city}, ${geo.country}`;
  return 'Unknown Location';
};

// ─── Registration & Email Verification ──────────────────────────────────────

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return next(new AppError('All fields required', 400));
    if (password.length < 6) return next(new AppError('Password must be at least 6 characters', 400));

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user && user.isEmailVerified) return next(new AppError('Email already registered', 409));

    const otp = generateOtp();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    if (user) {
      // Resend OTP for unverified user
      user.name = name;
      user.password = password;
      user.emailVerificationOtp = otp;
      user.emailVerificationExpires = expires;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        emailVerificationOtp: otp,
        emailVerificationExpires: expires,
        isEmailVerified: false
      });
    }

    await sendVerificationOtp(user.email, otp);
    res.status(201).json({ success: true, message: 'OTP sent to email. Please verify.' });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new AppError('Email and OTP required', 400));

    const user = await User.findOne({ email: email.toLowerCase() }).select('+emailVerificationOtp +emailVerificationExpires');
    if (!user) return next(new AppError('User not found', 404));
    if (user.isEmailVerified) return next(new AppError('Email already verified', 400));

    if (user.emailVerificationOtp !== otp || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return next(new AppError('Invalid or expired OTP', 400));
    }

    user.isEmailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationExpires = undefined;

    // Create initial session
    const ip = getClientIp(req);
    const location = getLocation(ip);
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const sessionId = crypto.randomBytes(16).toString('hex');
    const refreshToken = signRefreshToken(user.id, user.email, sessionId);

    user.sessions.push({
      token: sessionId,
      userAgent,
      ip,
      location,
      deviceType: 'Web',
      lastActive: new Date()
    });

    await user.save({ validateBeforeSave: false });

    const accessToken = signAccessToken(user.id, user.email);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, hasAcceptedTerms: user.hasAcceptedTerms },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login & 2FA ────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return next(new AppError('Email and password required', 400));

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid credentials', 401));
    }

    if (!user.isEmailVerified) {
      return next(new AppError('Please verify your email first', 403));
    }

    const ip = getClientIp(req);
    const location = getLocation(ip);
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    // Check if new IP/Device
    const isNewLocation = !user.sessions.some(s => s.ip === ip);
    if (isNewLocation) {
      await sendLoginAlert(user.email, userAgent, location, ip);
    }

    // 2FA Check
    if (user.isTwoFactorEnabled) {
      const tempToken = signTempToken(user.id);
      res.json({ success: true, requires2FA: true, tempToken, message: '2FA required' });
      return;
    }

    // Standard Login
    const sessionId = crypto.randomBytes(16).toString('hex');
    const refreshToken = signRefreshToken(user.id, user.email, sessionId);

    user.sessions.push({ token: sessionId, userAgent, ip, location, deviceType: 'Web', lastActive: new Date() });
    if (user.sessions.length > 5) user.sessions.shift();
    await user.save({ validateBeforeSave: false });

    const accessToken = signAccessToken(user.id, user.email);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, hasAcceptedTerms: user.hasAcceptedTerms },
    });
  } catch (err) {
    next(err);
  }
};

export const verify2FA = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) return next(new AppError('Token and code required', 400));

    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId).select('+twoFactorSecret');
    
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return next(new AppError('2FA not enabled', 400));
    }

    const isValid = authenticator.check(code, user.twoFactorSecret);
    if (!isValid) return next(new AppError('Invalid 2FA code', 401));

    const ip = getClientIp(req);
    const location = getLocation(ip);
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const sessionId = crypto.randomBytes(16).toString('hex');
    const refreshToken = signRefreshToken(user.id, user.email, sessionId);

    user.sessions.push({ token: sessionId, userAgent, ip, location, deviceType: 'Web', lastActive: new Date() });
    if (user.sessions.length > 5) user.sessions.shift();
    await user.save({ validateBeforeSave: false });

    const accessToken = signAccessToken(user.id, user.email);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, hasAcceptedTerms: user.hasAcceptedTerms },
    });
  } catch (err) {
    next(new AppError('Invalid or expired token', 401));
  }
};

// ─── Forgot & Reset Password ────────────────────────────────────────────────

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('Email required', 400));

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const otp = generateOtp();
      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save({ validateBeforeSave: false });
      await sendPasswordResetOtp(user.email, otp);
    }

    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'If an account exists, a reset OTP has been sent.' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return next(new AppError('Missing fields', 400));
    if (newPassword.length < 6) return next(new AppError('Password too short', 400));

    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetPasswordOtp +resetPasswordExpires');
    if (!user) return next(new AppError('Invalid request', 400));

    if (user.resetPasswordOtp !== otp || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return next(new AppError('Invalid or expired OTP', 400));
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    // Revoke all sessions on password reset
    user.sessions = [];
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (err) {
    next(err);
  }
};

// ─── Token Refresh & Logout ─────────────────────────────────────────────────

export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError('Refresh token required', 400));

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    const user = await User.findById(decoded.userId);
    
    if (!user) return next(new AppError('Invalid token', 401));

    const sessionIndex = user.sessions.findIndex(s => s.token === decoded.sessionId);
    if (sessionIndex === -1) return next(new AppError('Session revoked', 401));

    // Rotate token
    const newSessionId = crypto.randomBytes(16).toString('hex');
    const newAccessToken = signAccessToken(user.id, user.email);
    const newRefreshToken = signRefreshToken(user.id, user.email, newSessionId);

    user.sessions[sessionIndex].token = newSessionId;
    user.sessions[sessionIndex].lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    next(new AppError('Invalid or expired refresh token', 401));
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken && req.user) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!, { ignoreExpiration: true }) as any;
      const user = await User.findById(req.user.id);
      if (user) {
        user.sessions = user.sessions.filter(s => s.token !== decoded.sessionId);
        await user.save({ validateBeforeSave: false });
      }
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
