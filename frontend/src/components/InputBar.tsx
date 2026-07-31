import React, { useCallback, useRef, useState } from 'react';
import {
  Globe,
  Paperclip,
  Send,
  Square,
  X,
  Zap,
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { MODELS, type ModelId } from '../types';

const InputBar: React.FC = () => {
  const {
    isStreaming,
    selectedModel,
    enableWebSearch,
    sendMessage,
    abortStream,
    setSelectedModel,
    setEnableWebSearch,
  } = useChat();

  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = useCallback(async () => {
    const msg = text.trim();
    if ((!msg && !file) || isStreaming) return;

    setText('');
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await sendMessage({ message: msg, file: file || undefined });
  }, [text, file, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-area">
      <div className="input-area-inner">
      {/* Toolbar */}
      <div className="input-toolbar">
        {/* Model Selector */}
        <div className="model-selector">
          <Zap size={14} style={{ color: 'var(--primary-light)' }} />
          <select
            id="model-selector"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelId)}
            disabled={isStreaming}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.icon} {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Web Search Toggle */}
        <button
          id="web-search-toggle"
          className={`btn-icon ${enableWebSearch ? 'active' : ''}`}
          onClick={() => setEnableWebSearch(!enableWebSearch)}
          title={enableWebSearch ? 'Web Search ON' : 'Web Search OFF'}
        >
          <Globe size={16} />
        </button>

        {enableWebSearch && (
          <span style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>
            🌐 Web search on
          </span>
        )}
      </div>

      {/* File Preview */}
      {file && (
        <div className="file-preview-chip">
          {filePreview ? (
            <img src={filePreview} alt="preview" className="file-preview-img" />
          ) : (
            <span>📄</span>
          )}
          <span style={{ fontSize: 12 }}>{file.name}</span>
          <button className="file-remove-btn" onClick={clearFile}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Input wrapper */}
      <div className="input-wrapper">
        {/* File Upload */}
        <button
          id="file-upload-btn"
          className="btn-icon"
          style={{ border: 'none', background: 'transparent' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
          title="Attach file or image"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt,.csv,.json,.pdf,.md,.html,.js,.ts,.tsx,.jsx"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-input"
        />

        <textarea
          ref={textareaRef}
          id="chat-input"
          className="chat-textarea"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? 'KymiraAI is thinking...'
              : 'Message KymiraAI... (Shift+Enter for new line)'
          }
          rows={1}
          disabled={isStreaming && !file}
        />

        {isStreaming ? (
          <button className="stop-btn" onClick={abortStream} title="Stop generation" id="stop-btn">
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!text.trim() && !file}
            title="Send message"
            id="send-btn"
          >
            <Send size={16} />
          </button>
        )}
      </div>

        <p className="input-hint">
          KymiraAI is built for developers to solve complex problems and write robust code.
        </p>
      </div>
    </div>
  );
};

export default InputBar;
