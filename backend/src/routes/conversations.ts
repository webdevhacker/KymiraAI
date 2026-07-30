import { Router } from 'express';
import {
  getConversations,
  getConversationWithMessages,
  updateConversation,
  deleteConversation,
  deleteAllConversations,
} from '../controllers/conversationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getConversations);
router.delete('/', requireAuth, deleteAllConversations);
router.get('/:id', requireAuth, getConversationWithMessages);
router.put('/:id', requireAuth, updateConversation);
router.delete('/:id', requireAuth, deleteConversation);

export default router;
