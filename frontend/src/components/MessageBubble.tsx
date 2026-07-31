import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Download, ExternalLink, Brain } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="code-copy-btn" onClick={handleCopy}>
      {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-row">
        {/* Avatar */}
        <div className={`message-avatar ${isUser ? 'user' : 'assistant'}`}>
          {isUser ? '👤' : '🤖'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Tool Status Indicators */}
          {message.isStreaming && message.streamingState === 'searching' && (
            <div className="tool-status">
              <div className="tool-spinner" />
              <span className="tool-status-icon">🔍</span>
              <span>Searching the web for: <em>"{message.searchQuery}"</em></span>
            </div>
          )}
          {message.isStreaming && message.streamingState === 'generating_image' && (
            <div className="tool-status">
              <div className="tool-spinner" />
              <span className="tool-status-icon">🎨</span>
              <span>Generating image: <em>"{message.imagePrompt?.substring(0, 60)}..."</em></span>
            </div>
          )}

          {/* Search Results */}
          {message.searchResults && message.searchResults.length > 0 && (
            <div className="search-results">
              {message.searchResults.map((result, i) => (
                <a
                  key={i}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="search-result-card"
                >
                  <div className="search-result-title">
                    {result.title}
                    <ExternalLink size={10} style={{ marginLeft: 4 }} />
                  </div>
                  <div className="search-result-snippet">{result.snippet}</div>
                  <div className="search-result-url">{result.url}</div>
                </a>
              ))}
            </div>
          )}

          {/* Generated Image */}
          {message.imageUrl && (
            <div className="generated-image">
              <img src={message.imageUrl} alt="AI generated" loading="lazy" />
              <div className="generated-image-overlay">
                <a
                  href={message.imageUrl}
                  download="kymiraai-image.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-icon"
                  title="Download"
                >
                  <Download size={14} />
                </a>
                <a
                  href={message.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-icon"
                  title="Open in new tab"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          {/* Attachment */}
          {message.attachments?.map((att, i) => (
            <div key={i} className="file-attachment">
              {att.type === 'image' ? '🖼️' : '📄'} {att.name}
            </div>
          ))}

          {/* Message bubble */}
          {(message.content || message.reasoning || message.isStreaming) && (
            <div className="message-bubble">
              {isUser ? (
                <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
              ) : (
                <>
                  {message.reasoning && (
                    <div className="reasoning-block">
                      <div className="reasoning-header">
                        <Brain size={14} />
                        Thinking Process
                      </div>
                      <span style={{ whiteSpace: 'pre-wrap' }}>{message.reasoning}</span>
                    </div>
                  )}
                  {message.content && (
                    <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      const isBlock = match || codeString.includes('\n');

                      if (isBlock) {
                        return (
                          <div className="code-block-wrapper">
                            <div className="code-block-header">
                              <span>{match?.[1] || 'code'}</span>
                              <CopyButton text={codeString} />
                            </div>
                            <SyntaxHighlighter
                              style={oneDark as any}
                              language={match?.[1] || 'text'}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                borderRadius: '0 0 12px 12px',
                                fontSize: '13.5px',
                                lineHeight: '1.5',
                              }}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }

                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    img({ src, alt, ...props }) {
                      return (
                        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                          <img
                            src={src}
                            alt={alt}
                            style={{ maxWidth: '100%', borderRadius: '8px', display: 'block' }}
                            {...(props as any)}
                          />
                          {alt && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>{alt}</div>}
                        </div>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </>
          )}
              {/* Streaming cursor */}
              {message.isStreaming && message.streamingState === null && (
                <span className="streaming-cursor" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MessageBubble);
