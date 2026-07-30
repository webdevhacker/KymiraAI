import { rateLimit } from 'express-rate-limit';

/**
 * General rate limiter: 60 requests per minute per IP
 * Applied to all routes globally
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again in a minute.',
  },
  skip: (req) => req.path === '/health',
});

/**
 * AI rate limiter: 10 requests per minute per authenticated user
 * Applied to /api/chat routes to prevent API abuse
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  message: {
    success: false,
    message: 'AI request limit reached (10/min). Please wait a moment and try again.',
  },
});

/**
 * Auth rate limiter: 5 attempts per 15 minutes
 * Applied to login and register routes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});
