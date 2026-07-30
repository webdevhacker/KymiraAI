import { Router } from 'express';
import {
  getMemoriesHandler,
  deleteMemoryFact,
  clearAllMemories,
} from '../controllers/memoryController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getMemoriesHandler);
router.delete('/clear', requireAuth, clearAllMemories);
router.delete('/:index', requireAuth, deleteMemoryFact);

export default router;
