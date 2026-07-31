import { Router } from 'express';
import { 
  register, 
  login, 
  refreshTokenHandler, 
  logout, 
  getMe, 
  verifyEmail, 
  verify2FA, 
  requestFallback2FA,
  forgotPassword, 
  resetPassword 
} from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/fallback-2fa', requestFallback2FA);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshTokenHandler);

// Protected routes
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

export default router;
