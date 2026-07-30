import React, { useState } from 'react';
import { X, Image as ImageIcon, Loader } from 'lucide-react';
import { generateImage } from '../api/chat';
import type { ImageSize } from '../types';

interface ImageGenPanelProps {
  onClose: () => void;
}

const SIZES: { value: ImageSize; label: string; icon: string }[] = [
  { value: '1024x1024', label: 'Square', icon: '⬛' },
  { value: '1792x1024', label: 'Landscape', icon: '▬' },
  { value: '1024x1792', label: 'Portrait', icon: '▮' },
];

const ImageGenPanel: React.FC<ImageGenPanelProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string; prompt: string } | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await generateImage(prompt.trim(), size);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Image generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()} id="image-gen-panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>🎨</div>
            <h2 className="panel-title">Generate Image</h2>
          </div>
          <button className="btn-icon" onClick={onClose} id="close-image-panel">
            <X size={16} />
          </button>
        </div>

        {/* Size Options */}
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Size</p>
        <div className="size-options">
          {SIZES.map((s) => (
            <button
              key={s.value}
              className={`size-option ${size === s.value ? 'selected' : ''}`}
              onClick={() => setSize(s.value)}
              id={`size-${s.value}`}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 11 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.value}</div>
            </button>
          ))}
        </div>

        {/* Prompt Input */}
        <div className="form-group">
          <label className="form-label">Describe your image</label>
          <textarea
            id="image-prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city at sunset with flying cars and neon lights, cinematic photography..."
            rows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleGenerate();
            }}
            style={{
              width: '100%', padding: '12px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)', fontSize: 14,
              fontFamily: 'inherit', resize: 'vertical', outline: 'none',
              lineHeight: 1.5,
            }}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          id="generate-image-btn"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isLoading}
          style={{ marginBottom: result ? 20 : 0 }}
        >
          {isLoading ? (
            <><div className="spinner" style={{ width: 16, height: 16 }} /> Generating...</>
          ) : (
            <><ImageIcon size={16} /> Generate with DALL-E 3</>
          )}
        </button>

        {/* Result */}
        {result && (
          <div style={{ marginTop: 8 }}>
            <div className="generated-image" style={{ maxWidth: '100%', borderRadius: 16 }}>
              <img src={result.imageUrl} alt={result.prompt} style={{ maxWidth: '100%' }} />
              <div className="generated-image-overlay">
                <a
                  href={result.imageUrl}
                  download="kymiraai-image.png"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-icon"
                  style={{ color: 'white' }}
                >
                  ⬇
                </a>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
              "{result.prompt}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenPanel;
