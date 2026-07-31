import express from 'express';
import { createSubscription, verifyPayment, webhook } from '../controllers/paymentController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.post('/create-subscription', requireAuth, createSubscription);
router.post('/verify', requireAuth, verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

export default router;
