import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';

const FEATURES = [
  { icon: '🌐', text: 'Live web search with real-time results' },
  { icon: '🎨', text: 'AI image generation with DALL-E 3' },
  { icon: '📎', text: 'File & image analysis via GPT-4o vision' },
  { icon: '🧠', text: 'Persistent memory across conversations' },
  { icon: '⚡', text: 'Streaming responses with typewriter effect' },
  { icon: '🔒', text: 'Secure auth with JWT token rotation' },
];

type AuthMode = 'login' | 'register' | 'verify-email' | 'verify-2fa' | 'forgot-password' | 'reset-password';

const AuthPage: React.FC = () => {
  const { isAuthenticated, loginSuccess } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/chat" replace />;

  const handleLogin = async () => {
    const res = await authApi.login(email, password);
    if (res.requires2FA && res.tempToken) {
      setTempToken(res.tempToken);
      setMode('verify-2fa');
      toast.success('Please complete 2FA');
    } else if (res.accessToken && res.refreshToken && res.user) {
      toast.success('Welcome back!');
      loginSuccess(res.user, res.accessToken, res.refreshToken);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) throw new Error('Name is required');
    if (!acceptedTerms) throw new Error('You must accept the terms and privacy policy');
    const res = await authApi.register(name, email, password);
    toast.success(res.message || 'OTP sent to email. Please verify.');
    setMode('verify-email');
  };

  const handleVerifyEmail = async () => {
    const res = await authApi.verifyEmail(email, otp);
    if (res.accessToken && res.refreshToken && res.user) {
      toast.success('Email verified successfully!');
      loginSuccess(res.user, res.accessToken, res.refreshToken);
    }
  };

  const handleVerify2FA = async () => {
    const res = await authApi.verify2FA(tempToken, otp);
    if (res.accessToken && res.refreshToken && res.user) {
      toast.success('Authentication successful!');
      loginSuccess(res.user, res.accessToken, res.refreshToken);
    }
  };

  const handleRequestFallback2FA = async () => {
    setIsLoading(true);
    try {
      const res = await authApi.requestFallback2FA(tempToken);
      toast.success(res.message || 'OTP sent to your email!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const res = await authApi.forgotPassword(email);
    toast.success(res.message);
    setMode('reset-password');
  };

  const handleResetPassword = async () => {
    const res = await authApi.resetPassword(email, otp, password);
    toast.success(res.message);
    setMode('login');
    setPassword('');
    setOtp('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') await handleLogin();
      else if (mode === 'register') await handleRegister();
      else if (mode === 'verify-email') await handleVerifyEmail();
      else if (mode === 'verify-2fa') await handleVerify2FA();
      else if (mode === 'forgot-password') await handleForgotPassword();
      else if (mode === 'reset-password') await handleResetPassword();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <div className="auth-brand-logo-icon">🤖</div>
          <span className="auth-brand-logo-text">KymiraAI</span>
        </div>
        <h1 className="auth-brand-tagline">
          Your personal<br />
          <span>AI agent</span>
        </h1>
        <p className="auth-brand-desc">
          A powerful AI assistant that searches the web, generates images, analyzes your files,
          and remembers important details about you.
        </p>
        <div className="auth-features">
          {FEATURES.map((f, i) => (
            <div key={i} className="auth-feature">
              <div className="auth-feature-icon">{f.icon}</div>
              <span className="auth-feature-text">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <h2 className="auth-form-title">
            {mode === 'login' ? 'Welcome back' : 
             mode === 'register' ? 'Create account' : 
             mode === 'verify-email' ? 'Verify Email' : 
             mode === 'verify-2fa' ? 'Two-Factor Authentication' : 
             mode === 'forgot-password' ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="auth-form-subtitle">
            {mode === 'login' ? 'Sign in to continue to KymiraAI' : 
             mode === 'register' ? 'Sign up to get started with KymiraAI' : 
             mode === 'verify-email' ? `Enter the OTP sent to ${email}` : 
             mode === 'verify-2fa' ? 'Enter the code from your authenticator app' : 
             mode === 'forgot-password' ? 'Enter your email to receive a reset code' : 'Enter the OTP and your new password'}
          </p>

          {(mode === 'login' || mode === 'register') && (
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => setMode('register')}
              >
                Sign Up
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} id="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="name-input">Full Name</label>
                <input
                  id="name-input"
                  className="form-input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot-password' || mode === 'reset-password' || mode === 'verify-email') && (
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">Email</label>
                <input
                  id="email-input"
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={mode === 'verify-email' || mode === 'reset-password'}
                />
              </div>
            )}

            {(mode === 'verify-email' || mode === 'verify-2fa' || mode === 'reset-password') && (
              <div className="form-group">
                <label className="form-label" htmlFor="otp-input">
                  {mode === 'verify-2fa' ? 'Authenticator Code (or Email OTP)' : 'One-Time Password'}
                </label>
                <input
                  id="otp-input"
                  className="form-input"
                  type="text"
                  placeholder="Enter code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                {mode === 'verify-2fa' && (
                  <div style={{ marginTop: '10px', textAlign: 'right' }}>
                    <button 
                      type="button" 
                      onClick={handleRequestFallback2FA}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '13px', cursor: 'pointer', padding: 0 }}
                    >
                      Lost access? Send OTP to Email
                    </button>
                  </div>
                )}
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset-password') && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label" htmlFor="password-input">
                    {mode === 'reset-password' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'login' && (
                    <span 
                      style={{ fontSize: 12, color: 'var(--primary-light)', cursor: 'pointer' }}
                      onClick={() => setMode('forgot-password')}
                    >
                      Forgot password?
                    </span>
                  )}
                </div>
                <input
                  id="password-input"
                  className="form-input"
                  type="password"
                  placeholder={mode === 'login' ? 'Your password' : 'Minimum 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}

            {mode === 'register' && (
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                />
                <label htmlFor="terms-checkbox" style={{ fontSize: 13, color: 'var(--text-desc)' }}>
                  I accept the <a href="/terms" target="_blank" style={{ color: 'var(--primary-light)' }}>Terms of Service</a> & <a href="/privacy" target="_blank" style={{ color: 'var(--primary-light)' }}>Privacy Policy</a>
                </label>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{ marginTop: 8 }}
            >
              {isLoading ? (
                <><div className="spinner" style={{ width: 18, height: 18 }} /> Loading...</>
              ) : (
                '→ Continue'
              )}
            </button>
          </form>

          {(mode !== 'login' && mode !== 'register') && (
            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-light)', fontWeight: 600, fontSize: 13 }}
                onClick={() => setMode('login')}
              >
                Back to login
              </button>
            </p>
          )}

          {(mode === 'login' || mode === 'register') && (
            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-light)', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
