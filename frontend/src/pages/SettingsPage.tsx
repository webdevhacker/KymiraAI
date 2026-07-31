import React, { useState, useEffect } from 'react';
import { userApi } from '../api/user';
import { useAuth } from '../contexts/AuthContext';
import type { Session, Memory } from '../types';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');
  
  // Profile State
  const [name, setName] = useState(user?.name || '');

  // Password Change State
  const [passwordStep, setPasswordStep] = useState<'idle' | 'otp'>('idle');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA State
  const [qrCode, setQrCode] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.isTwoFactorEnabled || false);

  // Delete Account State
  const [deleteStep, setDeleteStep] = useState<'idle' | 'verify'>('idle');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sessions & Memory State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setDataLoading(true);
    try {
      const res = await userApi.getProfile();
      setSessions(res.sessions || []);
      setMemory(res.memory || null);
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await userApi.updateProfile({ name });
      updateUser(res.user);
      toast.success('Profile updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleRequestPasswordChange = async () => {
    setPasswordLoading(true);
    try {
      const res = await userApi.requestPasswordChange();
      toast.success(res.message);
      setPasswordStep('otp');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request password change');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      const res = await userApi.verifyPasswordChange(otp, newPassword);
      toast.success(res.message);
      setPasswordStep('idle');
      setOtp('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGenerate2FA = async () => {
    try {
      const res = await userApi.generate2FA();
      setQrCode(res.qrCodeUrl);
    } catch (err: any) {
      toast.error('Failed to generate 2FA');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.verifyAndEnable2FA(twoFaCode);
      setIs2FAEnabled(true);
      if (user) updateUser({ ...user, isTwoFactorEnabled: true });
      toast.success('2FA successfully enabled!');
      setQrCode('');
      setTwoFaCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleRequestDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      const res = await userApi.requestDeleteAccount();
      toast.success(res.message);
      setDeleteStep('verify');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleVerifyDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDeleteLoading(true);
      const res = await userApi.verifyDeleteAccount(deleteOtp);
      toast.success(res.message);
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed');
      setDeleteLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.disable2FA(twoFaCode);
      setIs2FAEnabled(false);
      if (user) updateUser({ ...user, isTwoFactorEnabled: false });
      toast.success('2FA disabled successfully.');
      setTwoFaCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid code');
    }
  };

  const handleRevokeSession = async (tokenId: string) => {
    try {
      const res = await userApi.revokeSession(tokenId);
      setSessions(res.sessions);
      toast.success('Session revoked');
    } catch (err: any) {
      toast.error('Failed to revoke session');
    }
  };

  return (
    <div className="settings-layout">
      <div className="settings-sidebar">
        <Link to="/chat" className="settings-back-link">← Back to Chat</Link>
        <h1 className="settings-title">Settings</h1>
        
        <nav className="settings-nav">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          >Profile</button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
          >Security</button>
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`settings-nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
          >Sessions</button>
        </nav>
      </div>

      <div className="settings-main">
        <div className="settings-content-wrapper">
        {activeTab === 'profile' && (
          <div className="settings-fade-in">
            <h2 className="settings-section-title">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} style={{ marginBottom: 40 }}>
              <div className="form-group" style={{ marginBottom: 15 }}>
                <label className="form-label">Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: 15 }}>
                <label className="form-label">Email</label>
                <input className="form-input" value={user?.email} disabled />
              </div>
              <button type="submit" className="btn btn-primary">Save Profile</button>
            </form>

            <hr className="settings-divider" />

            <h2 className="settings-section-title">Change Password</h2>
            {passwordStep === 'idle' ? (
              <div>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                  Changing your password requires email verification. We will send a One-Time Password (OTP) to <strong>{user?.email}</strong>.
                </p>
                <button 
                  onClick={handleRequestPasswordChange} 
                  disabled={passwordLoading}
                  className="btn btn-secondary"
                >
                  {passwordLoading ? 'Sending...' : 'Request Password Change'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyPasswordChange}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                  Enter the OTP sent to your email and your new password below.
                </p>
                <div className="form-group" style={{ marginBottom: 15 }}>
                  <label className="form-label">One-Time Password (OTP)</label>
                  <input className="form-input" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="6-digit code" />
                </div>
                <div className="form-group" style={{ marginBottom: 15 }}>
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required placeholder="Minimum 6 characters" />
                </div>
                <div className="settings-btn-group">
                  <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                    {passwordLoading ? 'Verifying...' : 'Change Password'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setPasswordStep('idle')}>Cancel</button>
                </div>
              </form>
            )}

            <hr className="settings-divider" />

            <h2 className="settings-section-title">Technical Skills (AI Analyzed)</h2>
            <div style={{ marginBottom: 40 }}>
              {!memory || !memory.skills || Object.keys(memory.skills).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Start chatting about technical topics to build your AI-analyzed skill profile.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(memory.skills)
                    .sort(([, a], [, b]) => b - a)
                    .map(([skill, score]) => (
                    <div key={skill} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        <span>{skill}</span>
                        <span style={{ color: 'var(--primary-light)' }}>{score}/100</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${score}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))', borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="settings-divider" style={{ marginTop: 40, borderColor: 'rgba(244, 63, 94, 0.2)' }} />

            <h2 className="settings-section-title" style={{ color: 'var(--accent-rose)' }}>Danger Zone</h2>
            {deleteStep === 'idle' ? (
              <div>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                  Permanently delete your account and all associated data. This action is irreversible. We will send an OTP to <strong>{user?.email}</strong> to verify this action.
                </p>
                <button 
                  onClick={handleRequestDeleteAccount} 
                  disabled={deleteLoading}
                  className="btn"
                  style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(244, 63, 94, 0.3)' }}
                >
                  {deleteLoading ? 'Sending OTP...' : 'Delete Account'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyDeleteAccount}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                  Enter the OTP sent to your email to confirm account deletion.
                </p>
                <div className="form-group" style={{ marginBottom: 15 }}>
                  <label className="form-label" style={{ color: 'var(--accent-rose)' }}>Delete OTP</label>
                  <input className="form-input" value={deleteOtp} onChange={e => setDeleteOtp(e.target.value)} required placeholder="6-digit code" />
                </div>
                <div className="settings-btn-group">
                  <button type="submit" className="btn" style={{ background: 'var(--accent-rose)', color: '#fff' }} disabled={deleteLoading}>
                    {deleteLoading ? 'Deleting...' : 'Confirm Deletion'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setDeleteStep('idle')}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-fade-in">
            <h2 className="settings-section-title">Two-Factor Authentication</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 30 }}>
              {is2FAEnabled ? '2FA is currently enabled on your account.' : 'Enhance your security by enabling Two-Factor Authentication.'}
            </p>

            {!is2FAEnabled ? (
              qrCode ? (
                <form onSubmit={handleVerify2FA} className="settings-form">
                  <p style={{ fontSize: 14, marginBottom: 15 }}>1. Scan this QR code with your Authenticator app (e.g. Google Authenticator, Authy).</p>
                  <img src={qrCode} alt="2FA QR Code" style={{ display: 'block', margin: '0 auto 20px', borderRadius: 8, background: '#fff', padding: 10 }} />
                  <p style={{ fontSize: 14, marginBottom: 15 }}>2. Enter the 6-digit code from the app.</p>
                  <div className="form-group">
                    <input className="form-input" value={twoFaCode} onChange={e => setTwoFaCode(e.target.value)} required placeholder="6-digit code" />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Verify & Enable 2FA</button>
                </form>
              ) : (
                <button onClick={handleGenerate2FA} className="btn btn-primary">Setup 2FA</button>
              )
            ) : (
              <form onSubmit={handleDisable2FA} className="settings-form">
                <div className="form-group" style={{ marginBottom: 15 }}>
                  <label className="form-label">Enter Code to Disable 2FA</label>
                  <input className="form-input" value={twoFaCode} onChange={e => setTwoFaCode(e.target.value)} required placeholder="6-digit code" />
                </div>
                <button type="submit" className="btn btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>Disable 2FA</button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="settings-fade-in">
            <h2 className="settings-section-title">Active Sessions</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 30 }}>
              These are the devices that have logged into your account. Revoke any unfamiliar ones.
            </p>
            {dataLoading ? <p>Loading sessions...</p> : (
              <div className="settings-sessions-list">
                {[...sessions].sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()).map((s, index) => (
                  <div key={s.token} className="settings-session-item">
                    <div className="session-info">
                      <div className="session-device" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {s.deviceType}
                        {index === 0 ? (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>Active</span>
                        ) : (
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Inactive</span>
                        )}
                      </div>
                      <div className="session-detail">Location: {s.location}</div>
                      <div className="session-detail">IP: {s.ip}</div>
                      <div className="session-detail">Last Active: {new Date(s.lastActive).toLocaleString()}</div>
                    </div>
                    {index !== 0 && (
                      <button 
                        onClick={() => handleRevokeSession(s.token)}
                        className="session-revoke-btn"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
                {sessions.length === 0 && <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No active sessions found.</p>}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
