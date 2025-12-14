'use client';

import { useState, useEffect } from 'react';

/**
 * Accessibility controls for all mini-games
 * - Pause/Resume with P key
 * - Reduced Motion toggle
 */
interface AccessibilityControlsProps {
  onPauseToggle?: (isPaused: boolean) => void;
  isPaused?: boolean;
}

export function AccessibilityControls({ onPauseToggle, isPaused = false }: AccessibilityControlsProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Load reduced motion setting
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nebula_reduced_motion');
      setReducedMotion(saved === 'true');
    } catch (error) {
      console.error('Failed to load reduced motion setting:', error);
    }
  }, []);

  // Save reduced motion setting
  const toggleReducedMotion = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    
    try {
      localStorage.setItem('nebula_reduced_motion', newValue.toString());
      
      // Show tooltip
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      
      // Reload may be needed for some effects
      console.log('Reduced motion:', newValue);
    } catch (error) {
      console.error('Failed to save reduced motion setting:', error);
    }
  };

  // Handle P key for pause
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        // Don't trigger if typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        
        if (onPauseToggle) {
          onPauseToggle(!isPaused);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPaused, onPauseToggle]);

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {/* Pause button */}
      <button
        onClick={() => onPauseToggle && onPauseToggle(!isPaused)}
        style={{
          padding: '10px 16px',
          background: isPaused ? 'var(--accent)' : 'rgba(26, 26, 46, 0.9)',
          color: 'white',
          border: '2px solid rgba(155, 89, 182, 0.5)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.borderColor = 'var(--accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'rgba(155, 89, 182, 0.5)';
        }}
        title="Pause game (P key)"
      >
        {isPaused ? '▶️ Resume' : '⏸️ Pause'} (P)
      </button>

      {/* Reduced Motion toggle */}
      <button
        onClick={toggleReducedMotion}
        style={{
          padding: '10px 16px',
          background: reducedMotion ? 'rgba(135, 206, 235, 0.3)' : 'rgba(26, 26, 46, 0.9)',
          color: 'white',
          border: '2px solid rgba(135, 206, 235, 0.5)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.borderColor = 'rgba(135, 206, 235, 1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'rgba(135, 206, 235, 0.5)';
        }}
        title="Toggle reduced motion for accessibility"
      >
        🎭 Reduced Motion: {reducedMotion ? 'ON' : 'OFF'}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '10px',
          padding: '12px 16px',
          background: 'rgba(26, 26, 46, 0.95)',
          color: 'white',
          border: '2px solid var(--accent)',
          borderRadius: '8px',
          fontSize: '14px',
          whiteSpace: 'nowrap',
          animation: 'fadeIn 0.3s',
          backdropFilter: 'blur(10px)',
        }}>
          ✓ Setting saved! May need to restart game.
        </div>
      )}
    </div>
  );
}
