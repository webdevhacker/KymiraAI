import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import type { User, Session } from '../types';

interface AdminUser extends User {
  _id?: string;
  createdAt: string;
  sessions: Session[];
}

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await apiClient.get('/admin/users');
      setUsers(data.users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      setUsers(users.filter((u) => u.id !== id && u._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRevokeSession = async (userId: string, tokenId: string) => {
    if (!window.confirm('Revoke this session?')) return;
    try {
      await apiClient.delete(`/admin/sessions/${userId}/${tokenId}`);
      setUsers(users.map(u => {
        if (u.id === userId || u._id === userId) {
          return { ...u, sessions: u.sessions.filter(s => s.token !== tokenId) };
        }
        return u;
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to revoke session');
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ 
          fontSize: 32, 
          fontWeight: 800, 
          background: 'linear-gradient(to right, #a78bfa, #60a5fa)', 
          WebkitBackgroundClip: 'text', 
          color: 'transparent',
          margin: 0
        }}>
          System Administration
        </h1>
        <Link to="/" style={{ color: 'var(--primary-light)', textDecoration: 'none', padding: '8px 16px', background: 'var(--bg-panel)', borderRadius: 8, border: '1px solid var(--border)' }}>← Back to Chat</Link>
      </div>
      
      {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: 16, borderRadius: 8, marginBottom: 20 }}>{error}</div>}
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" style={{ width: 30, height: 30 }} />
        </div>
      ) : (
        <div style={{ background: 'rgba(20, 20, 25, 0.6)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>User Info</th>
                <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Role</th>
                <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Joined</th>
                <th style={{ padding: '20px 24px', color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const uid = u.id || u._id || '';
                return (
                  <React.Fragment key={uid}>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                          background: u.role === 'admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(96, 165, 250, 0.15)',
                          color: u.role === 'admin' ? '#34d399' : '#93c5fd',
                          border: `1px solid ${u.role === 'admin' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(96, 165, 250, 0.3)'}`
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', color: 'var(--text-desc)', fontSize: 14 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDeleteUser(uid)}
                          disabled={user.id === uid}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', 
                            padding: '8px 16px', borderRadius: 8, cursor: user.id === uid ? 'not-allowed' : 'pointer',
                            fontSize: 13, fontWeight: 600, opacity: user.id === uid ? 0.5 : 1, transition: 'all 0.2s'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {u.sessions && u.sessions.length > 0 && (
                      <tr style={{ background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td colSpan={4} style={{ padding: '24px 32px' }}>
                          <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 16 }}>Active Sessions</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {[...u.sessions].sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()).map((s, index) => (
                              <div key={s.token} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 16, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.05)', fontSize: 13, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                  <strong style={{ color: 'var(--primary-light)' }}>{s.deviceType}</strong>
                                  {index === 0 && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>Latest</span>}
                                </div>
                                <div style={{ color: 'var(--text-desc)', marginBottom: 6 }}><span style={{ color: 'var(--text-muted)' }}>IP:</span> {s.ip}</div>
                                <div style={{ color: 'var(--text-desc)', marginBottom: 6 }}><span style={{ color: 'var(--text-muted)' }}>Loc:</span> {s.location}</div>
                                <div style={{ color: 'var(--text-desc)', marginBottom: 16 }}><span style={{ color: 'var(--text-muted)' }}>Active:</span> {new Date(s.lastActive).toLocaleString()}</div>
                                <button 
                                  onClick={() => handleRevokeSession(uid, s.token)}
                                  style={{ width: '100%', background: 'none', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#f87171', padding: '6px 0', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = 'none'; }}
                                >
                                  Revoke
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
