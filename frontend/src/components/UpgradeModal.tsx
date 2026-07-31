import React, { useState } from 'react';
import { X, CheckCircle, Zap, Shield, Crown } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './UpgradeModal.css';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { token, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Create order/subscription on backend
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/payments/create-subscription`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Load Razorpay script
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        setError('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      // 3. Initialize Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'dummy_key_id',
        amount: data.amount, // Only used for orders
        currency: 'INR',
        name: 'KymiraAI',
        description: 'Pro Subscription (500 Credits)',
        subscription_id: data.type === 'subscription' ? data.id : undefined,
        order_id: data.type === 'order' ? data.id : undefined,
        handler: async function (response: any) {
          try {
            await axios.post(
              `${import.meta.env.VITE_API_URL}/payments/verify`,
              response,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            await checkAuth(); // Refresh user state
            onClose();
          } catch (err) {
            setError('Payment verification failed.');
          }
        },
        theme: {
          color: '#10a37f', // Primary color
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadScript = (src: string) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="upgrade-header">
          <div className="upgrade-icon">
            <Crown size={32} />
          </div>
          <h2>Upgrade to Pro</h2>
          <p>Supercharge your AI workflow with premium models and higher limits.</p>
        </div>

        <div className="upgrade-features">
          <div className="feature-item">
            <CheckCircle size={16} className="feature-icon" />
            <span><strong>500 Premium Credits</strong> every month</span>
          </div>
          <div className="feature-item">
            <CheckCircle size={16} className="feature-icon" />
            <span>Access to <strong>Claude 3.5 Sonnet & Opus</strong></span>
          </div>
          <div className="feature-item">
            <CheckCircle size={16} className="feature-icon" />
            <span>Access to <strong>GPT-4o</strong></span>
          </div>
          <div className="feature-item">
            <CheckCircle size={16} className="feature-icon" />
            <span>Priority processing & web search</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="upgrade-action">
          <button className="btn-primary upgrade-btn" onClick={handleUpgrade} disabled={loading}>
            {loading ? 'Processing...' : 'Upgrade Now - ₹999/month'}
          </button>
          <div className="refund-policy">
            <Shield size={12} />
            <span><strong>Refund Policy:</strong> Strictly no refunds. Subscriptions auto-renew monthly and can be cancelled anytime.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
