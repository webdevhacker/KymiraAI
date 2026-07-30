import { Router } from 'express';
import {
  getConversations,
  getConversationWithMessages,
  updateConversation,
  deleteConversation,
} from '../controllers/conversationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getConversations);
router.get('/:id', requireAuth, getConversationWithMessages);
router.put('/:id', requireAuth, updateConversation);
router.delete('/:id', requireAuth, deleteConversation);

export default router;
