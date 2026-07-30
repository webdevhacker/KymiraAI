import { Router } from 'express';
import { streamChatHandler, generateImageHandler } from '../controllers/chatController';
import { requireAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { upload } from '../middleware/upload';

const router = Router();

// POST /api/chat/stream - Streaming chat with optional file upload
router.post('/stream', requireAuth, aiLimiter, upload.single('file'), streamChatHandler);

// POST /api/chat/image - Explicit image generation (UI-triggered)
router.post('/image', requireAuth, aiLimiter, generateImageHandler);

export default router;
