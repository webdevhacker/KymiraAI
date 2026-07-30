import { Router } from 'express';
import { getUsers, deleteUser, revokeUserSession } from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.use(requireAdmin);

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.delete('/sessions/:userId/:tokenId', revokeUserSession);

export default router;
