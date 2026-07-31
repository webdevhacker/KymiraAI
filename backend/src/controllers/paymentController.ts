import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { User } from '../models/User';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

// Create a new subscription
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // In a real scenario, you'd create a Plan in Razorpay dashboard and use its plan_id here
    // For demo/simplicity without creating an actual recurring plan, we'll create a standard order
    // However, the user specifically requested a monthly subscription.
    // Assuming a plan ID is set in environment variable:
    const planId = process.env.RAZORPAY_PLAN_ID;
    
    if (planId) {
      // True subscription
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 120, // 10 years
      });
      return res.json({ id: subscription.id, amount: 99900, type: 'subscription' });
    } else {
      // Fallback: One-time order for demo if no plan is configured
      const order = await razorpay.orders.create({
        amount: 999 * 100, // 999 INR in paise
        currency: 'INR',
        receipt: `receipt_${userId}_${Date.now()}`,
      });
      return res.json({ id: order.id, amount: order.amount, type: 'order' });
    }
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

// Verify payment signature
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { razorpay_payment_id, razorpay_order_id, razorpay_subscription_id, razorpay_signature } = req.body;

    const idToVerify = razorpay_subscription_id || razorpay_order_id;
    if (!idToVerify || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(idToVerify + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Payment is valid, upgrade user
    await User.findByIdAndUpdate(userId, {
      isPro: true,
      credits: 500,
      subscriptionId: razorpay_subscription_id || razorpay_order_id,
      subscriptionStatus: 'active',
    });

    res.json({ success: true, message: 'Payment verified and account upgraded to PRO' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

// Webhook for subscription auto-renewal
export const webhook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    const signature = req.headers['x-razorpay-signature'] as string;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    
    // When a subscription is charged successfully on auto-renewal
    if (event === 'subscription.charged') {
      const subscriptionId = req.body.payload.subscription.entity.id;
      // Replenish 500 credits
      await User.findOneAndUpdate(
        { subscriptionId },
        { credits: 500, subscriptionStatus: 'active', isPro: true }
      );
    } 
    // When a subscription is cancelled or halted
    else if (event === 'subscription.cancelled' || event === 'subscription.halted') {
      const subscriptionId = req.body.payload.subscription.entity.id;
      await User.findOneAndUpdate(
        { subscriptionId },
        { subscriptionStatus: 'cancelled', isPro: false }
      );
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
