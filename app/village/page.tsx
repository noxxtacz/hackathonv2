'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitLog } from '@/lib/submitLog';
import { GameFrame } from '@/components/GameFrame';

export default function VillagePage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [npcName, setNpcName] = useState('');
  const [userInput, setUserInput] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!mountRef.current || phaserGameRef.current) return;

    const initGame = async () => {
      if (typeof window === 'undefined') return;

      const Phaser = (await import('phaser')).default;
      const { VillageScene } = await import('@/game/village/VillageScene');

      const config: any = {
        type: Phaser.AUTO,
        parent: mountRef.current,
        backgroundColor: '#2d4a3e',
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 800,
          height: 600,
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scene: [VillageScene],
      };

      const game = new Phaser.Game(config);
      phaserGameRef.current = game;

      game.events.on('showNPCDialog', (name: string) => {
        setNpcName(name);
        setShowModal(true);
        setUserInput('');
        setMessageSent(false);
        setError('');
        
        // Disable Phaser keyboard input when modal opens
        setTimeout(() => {
          if (game.input.keyboard) {
            game.input.keyboard.enabled = false;
          }
          textareaRef.current?.focus();
        }, 100);
      });
    };

    initGame();

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    setShowModal(false);
    setUserInput('');
    setError('');
    
    // Re-enable Phaser keyboard input
    if (phaserGameRef.current?.input?.keyboard) {
      phaserGameRef.current.input.keyboard.enabled = true;
    }
    
    // Re-enable input in the game scene
    const scene = phaserGameRef.current?.scene?.getScene('VillageScene') as any;
    if (scene) {
      scene.inputEnabled = true;
      if (scene.enableInput) {
        scene.enableInput();
      }
    }
  };

  const handleSend = async () => {
    if (!userInput.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      // Call the API to analyze the user's input
      await submitLog(userInput);
      
      // Show success message briefly then redirect to games
      setMessageSent(true);
      setTimeout(() => {
        handleClose();
        router.push('/mission/select');
      }, 1000);
    } catch (err) {
      console.error('Failed to analyze:', err);
      setError('Failed to analyze your thoughts. Please try again.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="page-container">
      <GameFrame
        title="🏘️ Cozy Village"
        subtitle="Use WASD or arrow keys to explore. Walk near NPCs to chat!"
      >
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      </GameFrame>

      {showModal && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{npcName} says:</h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              {npcName === 'Luna'
                ? "Welcome, traveler! 🌙 I sense you've had quite a day. Would you like to share what's on your mind?"
                : npcName === 'Felix'
                ? "Meow! 🐱 I'm Felix. I love warm sunbeams and peaceful naps. Want to play a calming game?"
                : npcName === 'Bella'
                ? "Woof! 🐕 I'm Bella! Always here to bring joy and energy. How are you feeling today?"
                : "Cluck cluck! 🐔 Welcome to the village. We're all here to support your wellness journey!"}
            </p>
            
            {messageSent ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: 'var(--accent)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
                <p>Thank you for sharing! Your mood has been analyzed.</p>
              </div>
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  className="textarea"
                  placeholder="Share your thoughts with the village..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter' && e.ctrlKey && userInput.trim() && !isAnalyzing) {
                      handleSend();
                    }
                  }}
                  disabled={isAnalyzing}
                  style={{ marginBottom: '1rem' }}
                />
                
                {error && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '0.9rem'
                  }}>
                    {error}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={handleClose} className="btn btn-secondary" disabled={isAnalyzing}>
                    Close
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={!userInput.trim() || isAnalyzing}
                    className="btn btn-primary"
                    style={{ 
                      opacity: userInput.trim() && !isAnalyzing ? 1 : 0.5,
                      cursor: userInput.trim() && !isAnalyzing ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {isAnalyzing ? (
                      <span className="loading">
                        <span className="spinner"></span> Analyzing...
                      </span>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
