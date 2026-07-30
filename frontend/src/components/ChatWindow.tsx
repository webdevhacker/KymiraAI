import React, { useEffect, useRef } from 'react';
import { Globe, Menu, Zap } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import { MODELS } from '../types';

const SUGGESTIONS = [
  { icon: '💻', text: 'Write a robust REST API in Node.js with authentication' },
  { icon: '🐛', text: 'Help me debug a memory leak in my React application' },
  { icon: '🏗️', text: 'Design a scalable microservices architecture' },
  { icon: '🚀', text: 'Optimize my database queries for better performance' },
];

interface ChatWindowProps {
  conversationId: string | null;
  onOpenSidebar: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, onOpenSidebar }) => {
  const { messages, sendMessage, selectedModel, enableWebSearch } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as messages stream in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSuggestion = (text: string) => {
    sendMessage({ message: text });
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Chat Header ─────────────────────────────────────────────── */}
      <div className="chat-header">
        <div className="chat-header-left">
          {/* Hamburger — only visible on mobile via CSS */}
          <button
            className="hamburger-btn"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
            id="hamburger-btn"
          >
            <Menu size={18} />
          </button>

          <span className="chat-title">
            {conversationId ? '💬 Active conversation' : 'New Chat'}
          </span>
        </div>

        <div className="chat-header-right">
          {enableWebSearch && (
            <div className="header-badge header-badge-web">
              <Globe size={12} />
              <span>Web search active</span>
            </div>
          )}
          <div className="header-badge header-badge-model">
            <Zap size={12} style={{ color: 'var(--primary-light)' }} />
            {MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
          </div>
        </div>
      </div>

      {/* ── Messages / Empty State ───────────────────────────────────── */}
      {isEmpty ? (
        <div className="empty-state" id="empty-state">
          <div className="empty-state-icon">👨‍💻</div>
          <h1 className="empty-state-title">Ready to build?</h1>
          <p className="empty-state-sub">
            This AI agent focuses more on developers and programmers to solve their complex problems, write robust code, and debug efficiently.
          </p>

          <div className="suggestions-grid" id="suggestions-grid">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="suggestion-card"
                onClick={() => handleSuggestion(s.text)}
                id={`suggestion-${i}`}
              >
                <div className="suggestion-card-icon">{s.icon}</div>
                <div className="suggestion-card-text">{s.text}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages-container" id="messages-container">
          <div className="messages-inner">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* ── Input Area ──────────────────────────────────────────────── */}
      <InputBar />
    </>
  );
};

export default ChatWindow;
