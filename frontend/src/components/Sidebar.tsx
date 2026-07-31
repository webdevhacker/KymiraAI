import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Pencil,
  Brain,
  Image as ImageIcon,
  LogOut,
  Check,
  X,
  Settings,
  ShieldAlert
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMemory: () => void;
  onOpenImageGen: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenMemory, onOpenImageGen }) => {
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversationId,
    selectConversation,
    startNewChat,
    deleteConversation,
    deleteAllConversations,
    renameConversation,
  } = useChat();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRenameStart = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleRenameSubmit = async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      await deleteConversation(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🤖</div>
          <span className="sidebar-logo-name">KymiraAI</span>
        </div>

        <button className="new-chat-btn" onClick={startNewChat} id="new-chat-btn">
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Conversations list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
        <div className="sidebar-section-title" style={{ margin: 0, padding: 0 }}>Recent Chats</div>
        {conversations.length > 0 && (
          <button 
            onClick={() => { if(window.confirm('Are you sure you want to delete all chats? This cannot be undone.')) deleteAllConversations(); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.8 }}
            title="Clear all chats"
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            <Trash2 size={12} /> Clear All
          </button>
        )}
      </div>

      <div className="sidebar-conversations">
        {conversations.length === 0 && (
          <div style={{ padding: '20px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No conversations yet</p>
          </div>
        )}

        {conversations.map((conv) => (
          <div
            key={conv._id}
            className={`conversation-item ${activeConversationId === conv._id ? 'active' : ''}`}
            onClick={() => editingId !== conv._id && selectConversation(conv._id)}
            id={`conv-${conv._id}`}
          >
            <div className="conversation-item-icon">
              <MessageSquare size={14} />
            </div>

            {editingId === conv._id ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => handleRenameSubmit(conv._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(conv._id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                style={{
                  flex: 1, background: 'var(--bg-hover)',
                  border: '1px solid var(--primary)',
                  borderRadius: 6, padding: '2px 8px',
                  color: 'var(--text-primary)', fontSize: 13,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            ) : (
              <span className="conversation-item-text">{conv.title}</span>
            )}

            <div className="conversation-item-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="conv-action-btn"
                onClick={() => handleRenameStart(conv._id, conv.title)}
                title="Rename"
              >
                <Pencil size={12} />
              </button>
              <button
                className={`conv-action-btn ${confirmDeleteId === conv._id ? 'danger' : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(conv._id); }}
                title={confirmDeleteId === conv._id ? 'Click again to confirm' : 'Delete'}
              >
                {confirmDeleteId === conv._id ? <Check size={12} /> : <Trash2 size={12} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">

        <div className="sidebar-static-links" style={{ display: 'flex', justifyContent: 'center', gap: 15, padding: '10px 0', fontSize: 11 }}>
          <Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" style={{ color: 'var(--primary-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldAlert size={11} /> Admin
            </Link>
          )}
        </div>

          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer', borderRadius: 8, background: 'var(--bg-hover)', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }} onClick={() => navigate('/settings')}>
              <div className="user-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info" style={{ overflow: 'hidden', flex: 1 }}>
                <div className="user-name" style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</div>
                <div className="user-email" style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.email}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>Active</span>
                  {user?.isTwoFactorEnabled ? (
                    <span style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>2FA On</span>
                  ) : (
                    <span style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>2FA Off</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); logout(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '8px', marginRight: '-4px', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Logout" onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
              <LogOut size={16} />
            </button>
          </div>
      </div>
    </aside>
  );
};

export default Sidebar;
