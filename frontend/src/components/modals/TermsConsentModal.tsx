import React, { useState } from 'react';
import { userApi } from '../../api/user';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const TermsConsentModal: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await userApi.acceptTerms();
      if (user) {
        updateUser({ ...user, hasAcceptedTerms: true });
      }
    } catch (err) {
      console.error('Failed to accept terms', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.hasAcceptedTerms) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)'
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'var(--bg-panel)', padding: '32px', borderRadius: '16px',
        width: '500px', maxWidth: '90%', border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24 }}>Welcome to KymiraAI</h2>
        
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Before you start chatting, please review our terms. By using KymiraAI, you acknowledge that your conversation data may be used to train and improve our AI models to provide you with better responses.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32, fontSize: 13 }}>
          <Link to="/privacy" target="_blank" style={{ color: 'var(--primary-light)' }}>Read Privacy Policy</Link>
          <Link to="/terms" target="_blank" style={{ color: 'var(--primary-light)' }}>Read Terms of Service</Link>
        </div>

        <button 
          onClick={handleAccept} 
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: 16, fontWeight: 'bold' }}
        >
          {loading ? 'Accepting...' : 'I Agree & Continue'}
        </button>
      </div>
    </div>
  );
};

export default TermsConsentModal;
