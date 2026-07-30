import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  acceptTerms, 
  revokeSession, 
  generate2FA, 
  verifyAndEnable2FA, 
  disable2FA,
  requestPasswordChange,
  verifyPasswordChange
} from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/password/request', requestPasswordChange);
router.post('/profile/password/verify', verifyPasswordChange);

router.post('/accept-terms', acceptTerms);
router.delete('/sessions/:tokenId', revokeSession);

router.post('/2fa/generate', generate2FA);
router.post('/2fa/verify', verifyAndEnable2FA);
router.post('/2fa/disable', disable2FA);

export default router;
