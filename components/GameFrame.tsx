'use client';

import { ReactNode } from 'react';

interface GameFrameProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  controls?: ReactNode;
  showMode?: boolean;
  mode?: 'calm' | 'normal' | 'focus';
}

export function GameFrame({ 
  title, 
  subtitle, 
  children, 
  controls,
  showMode = false,
  mode = 'normal'
}: GameFrameProps) {
  const modeLabels = {
    calm: { label: '🌿 Calm', color: '#22c55e' },
    normal: { label: '⚖️ Normal', color: '#f59e0b' },
    focus: { label: '🎯 Focus', color: '#e94560' },
  };

  return (
    <div className="game-frame-container">
      {/* Header */}
      <div className="game-frame-header">
        <h1 className="game-frame-title">{title}</h1>
        {showMode && mode && (
          <div className="game-frame-mode" style={{ color: modeLabels[mode].color }}>
            {modeLabels[mode].label}
          </div>
        )}
        {subtitle && <p className="game-frame-subtitle">{subtitle}</p>}
      </div>

      {/* Game Canvas Container */}
      <div className="game-frame-wrapper">
        <div className="game-frame-canvas">
          {children}
        </div>
        
        {/* Vignette overlay */}
        <div className="game-frame-vignette" />
      </div>

      {/* Controls */}
      {controls && (
        <div className="game-frame-controls">
          {controls}
        </div>
      )}

      <style jsx>{`
        .game-frame-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 1rem;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .game-frame-header {
          text-align: center;
          margin-bottom: 1rem;
          width: 100%;
        }

        .game-frame-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--accent);
          margin: 0 0 0.5rem 0;
        }

        .game-frame-mode {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: var(--bg-dark);
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .game-frame-subtitle {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin: 0;
        }

        .game-frame-wrapper {
          position: relative;
          width: 100%;
          max-width: 800px;
          aspect-ratio: 4 / 3;
          min-height: 420px;
          background: #0a0a1e;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          border: 2px solid var(--accent-soft);
        }

        @media (min-width: 768px) {
          .game-frame-wrapper {
            min-height: 520px;
          }
        }

        .game-frame-canvas {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .game-frame-canvas :global(canvas) {
          max-width: 100%;
          max-height: 100%;
          display: block;
        }

        .game-frame-vignette {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          border-radius: 16px;
          box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.4);
        }

        .game-frame-controls {
          margin-top: 1rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

// End Game Modal Component
interface EndModalProps {
  show: boolean;
  title?: string;
  score: number;
  calmScore: number;
  message?: string;
  saving?: boolean;
}

export function EndModal({ 
  show, 
  title = "Well Done! ✨", 
  score, 
  calmScore, 
  message = "Great job taking time for yourself!",
  saving = false 
}: EndModalProps) {
  if (!show) return null;

  return (
    <div className="end-modal-overlay">
      <div className="end-modal-content">
        <div className="end-modal-emoji">🎉</div>
        <h2 className="end-modal-title">{title}</h2>
        
        <div className="end-modal-stats">
          <div className="end-modal-stat">
            <span className="end-modal-stat-label">Score</span>
            <span className="end-modal-stat-value">{score}</span>
          </div>
          <div className="end-modal-stat">
            <span className="end-modal-stat-label">Calm</span>
            <span className="end-modal-stat-value">{calmScore}%</span>
          </div>
        </div>
        
        <p className="end-modal-message">{message}</p>
        
        {saving && (
          <div className="end-modal-saving">
            <div className="end-modal-spinner" />
            <span>Saving progress...</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .end-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.3s ease-out;
          border-radius: 16px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .end-modal-content {
          text-align: center;
          padding: 2rem;
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .end-modal-emoji {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: bounce 0.6s ease-out;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .end-modal-title {
          font-size: 1.8rem;
          color: var(--accent);
          margin: 0 0 1.5rem 0;
        }

        .end-modal-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }

        .end-modal-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .end-modal-stat-label {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .end-modal-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
        }

        .end-modal-message {
          color: var(--text-muted);
          margin: 0 0 1rem 0;
        }

        .end-modal-saving {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--accent);
          font-size: 0.9rem;
        }

        .end-modal-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--text-muted);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
