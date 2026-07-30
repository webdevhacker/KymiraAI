import React, { useEffect, useState } from 'react';
import { X, Brain, Trash2, RefreshCw } from 'lucide-react';
import { memoryApi } from '../api/conversations';

interface MemoryPanelProps {
  onClose: () => void;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({ onClose }) => {
  const [facts, setFacts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const loadFacts = async () => {
    setIsLoading(true);
    try {
      const data = await memoryApi.getAll();
      setFacts(data);
    } catch {
      setFacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadFacts(); }, []);

  const handleDelete = async (index: number) => {
    try {
      const updated = await memoryApi.deleteFact(index);
      setFacts(updated);
    } catch {
      // Ignore
    }
  };

  const handleClear = async () => {
    if (confirmClear) {
      setIsClearing(true);
      try {
        await memoryApi.clearAll();
        setFacts([]);
        setConfirmClear(false);
      } catch {
        // Ignore
      } finally {
        setIsClearing(false);
      }
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel memory-panel" onClick={(e) => e.stopPropagation()} id="memory-panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={20} color="white" />
            </div>
            <div>
              <h2 className="panel-title">AI Memory</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {facts.length} stored fact{facts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-icon" onClick={loadFacts} title="Refresh" id="refresh-memory">
              <RefreshCw size={14} />
            </button>
            <button className="btn-icon" onClick={onClose} id="close-memory-panel">
              <X size={16} />
            </button>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          KymiraAI automatically learns and remembers important things about you from your
          conversations, personalizing future responses.
        </p>

        <div className="panel-content">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div className="spinner" />
            </div>
          ) : facts.length === 0 ? (
            <div className="memory-empty">
              <Brain size={48} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.4 }} />
              <p>No memories yet.</p>
              <p style={{ fontSize: 12, marginTop: 6 }}>
                Start chatting and KymiraAI will learn about you!
              </p>
            </div>
          ) : (
            <div>
              {facts.map((fact, i) => (
                <div key={i} className="memory-fact" id={`memory-fact-${i}`}>
                  <span className="memory-fact-icon">💡</span>
                  <span className="memory-fact-text">{fact}</span>
                  <button
                    className="btn-icon danger"
                    style={{ flexShrink: 0 }}
                    onClick={() => handleDelete(i)}
                    title="Delete this memory"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {facts.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
            <button
              id="clear-memory-btn"
              className={`btn btn-ghost ${confirmClear ? 'danger' : ''}`}
              onClick={handleClear}
              disabled={isClearing}
              style={{
                width: '100%',
                color: confirmClear ? 'var(--accent-rose)' : 'var(--text-secondary)',
                borderColor: confirmClear ? 'rgba(244,63,94,0.3)' : 'var(--glass-border)',
              }}
            >
              {isClearing ? (
                <div className="spinner" style={{ width: 16, height: 16 }} />
              ) : (
                <Trash2 size={15} />
              )}
              {confirmClear ? 'Click again to confirm deletion' : 'Clear all memories'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryPanel;
