import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
    <div style={{ padding: 40, maxWidth: 1000, margin: '0 auto', color: 'var(--text-primary)' }}>
      <h1 style={{ marginBottom: 20 }}>Admin Dashboard</h1>
      {error && <div style={{ color: '#ef4444', marginBottom: 20 }}>{error}</div>}
      
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div style={{ background: 'var(--bg-panel)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: 16 }}>Name</th>
                <th style={{ padding: 16 }}>Email</th>
                <th style={{ padding: 16 }}>Role</th>
                <th style={{ padding: 16 }}>Joined</th>
                <th style={{ padding: 16 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const uid = u.id || u._id || '';
                return (
                  <React.Fragment key={uid}>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 16 }}>{u.name}</td>
                      <td style={{ padding: 16 }}>{u.email}</td>
                      <td style={{ padding: 16 }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                          background: u.role === 'admin' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                          color: u.role === 'admin' ? '#10b981' : '#3b82f6'
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: 16 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: 16 }}>
                        <button 
                          onClick={() => handleDeleteUser(uid)}
                          disabled={user.id === uid}
                          style={{
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', 
                            padding: '6px 12px', borderRadius: 6, cursor: user.id === uid ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {u.sessions && u.sessions.length > 0 && (
                      <tr style={{ background: 'var(--bg-void)', borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={5} style={{ padding: '16px 32px' }}>
                          <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Active Sessions</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
                            {u.sessions.map(s => (
                              <div key={s.token} style={{ background: 'var(--bg-panel)', padding: 10, borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }}>
                                <div><strong>Device:</strong> {s.deviceType}</div>
                                <div><strong>IP:</strong> {s.ip}</div>
                                <div><strong>Location:</strong> {s.location}</div>
                                <div><strong>Last Active:</strong> {new Date(s.lastActive).toLocaleString()}</div>
                                <button 
                                  onClick={() => handleRevokeSession(uid, s.token)}
                                  style={{ marginTop: 8, background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}
                                >
                                  Revoke Session
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
