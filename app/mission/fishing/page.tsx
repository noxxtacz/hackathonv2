'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLatestSession, updateSessionWithGameData } from '@/lib/storage';
import { mapStressToDifficulty } from '@/lib/mapping';
import { GameFrame, EndModal } from '@/components/GameFrame';
import type { GameType } from '@/lib/types';

type GamePhase = 'playing' | 'ended' | 'feedback';

interface GameResult {
  type: GameType;
  score: number;
  calmScore: number;
  durationSec: number;
}

export default function FishingPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<any>(null);
  const listenerAttachedRef = useRef(false);
  const router = useRouter();
  
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [apiStressLevel, setApiStressLevel] = useState(50);
  const [postStress, setPostStress] = useState(50);
  const [difficulty, setDifficulty] = useState<'calm' | 'normal' | 'focus'>('normal');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [saving, setSaving] = useState(false);

  // Refs to avoid stale closures
  const difficultyRef = useRef(difficulty);
  const apiStressRef = useRef(apiStressLevel);
  
  useEffect(() => {
    difficultyRef.current = difficulty;
    apiStressRef.current = apiStressLevel;
  }, [difficulty, apiStressLevel]);

  // Get stress level from API analysis
  useEffect(() => {
    const session = getLatestSession();
    console.log('[FishingPage] Session on mount:', session);
    if (session?.analysis?.stressLevel) {
      const stressLevel = session.analysis.stressLevel;
      setApiStressLevel(stressLevel);
      setPostStress(stressLevel); // Start at same value, let user adjust
      
      const diff = mapStressToDifficulty(stressLevel);
      setDifficulty(diff);
      (window as any).gameDifficulty = diff;
      (window as any).gameMood = session.analysis.mood;
      console.log('[FishingPage] Stress:', stressLevel, 'Difficulty:', diff);
    }
  }, []);

  // Initialize Phaser game
  useEffect(() => {
    if (phase !== 'playing' || !mountRef.current || phaserGameRef.current) return;

    const initGame = async () => {
      if (typeof window === 'undefined') return;

      const Phaser = (await import('phaser')).default;
      const { FishingScene } = await import('@/game/fishing/FishingScene');

      const config: any = {
        type: Phaser.AUTO,
        parent: mountRef.current,
        backgroundColor: '#0a0a1e',
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
        scene: [FishingScene],
      };

      const game = new Phaser.Game(config);
      phaserGameRef.current = game;

      // Listen for mission:complete event (only once!)
      if (!listenerAttachedRef.current) {
        game.events.on('mission:complete', (payload: GameResult) => {
          console.log('[FishingPage] ========== RECEIVED PAYLOAD ==========');
          console.log('[FishingPage] Raw payload:', JSON.stringify(payload));
          
          setGameResult({
            type: payload.type || 'fishing',
            score: payload.score,
            calmScore: payload.calmScore,
            durationSec: payload.durationSec,
          });
          setPhase('ended');
          setSaving(true);

          // Save immediately using refs
          const gameData = {
            type: 'fishing' as const,
            score: payload.score,
            calmScore: payload.calmScore,
            durationSec: payload.durationSec,
            difficulty: difficultyRef.current,
            selfReportedBefore: apiStressRef.current,
          };
          console.log('[FishingPage] Saving game data:', gameData);
          updateSessionWithGameData(gameData);

          setTimeout(() => {
            setSaving(false);
            setPhase('feedback');
          }, 1200);
        });
        listenerAttachedRef.current = true;
      }
      
      // Legacy window callback
      (window as any).onGameEnd = (score: number, calmScore: number, durationSec: number) => {
        game.events.emit('mission:complete', { type: 'fishing', score, calmScore, durationSec });
      };
    };

    initGame();

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
        listenerAttachedRef.current = false;
      }
      delete (window as any).onGameEnd;
    };
  }, [phase, router]);

  // Submit feedback and redirect
  const submitFeedback = () => {
    if (gameResult) {
      const stressReduction = apiStressLevel - postStress;
      const happinessGain = stressReduction > 0 
        ? Math.round((stressReduction / Math.max(1, apiStressLevel)) * 100) 
        : 0;
      
      const finalData = {
        type: 'fishing' as const,
        score: gameResult.score,
        calmScore: gameResult.calmScore,
        durationSec: gameResult.durationSec,
        difficulty,
        selfReportedBefore: apiStressLevel,
        selfReportedAfter: postStress,
        happinessGain,
      };
      
      console.log('[FishingPage] submitFeedback - saving:', finalData);
      updateSessionWithGameData(finalData);
      
      // Verify the save
      const saved = getLatestSession();
      console.log('[FishingPage] Session after save:', saved?.game);
    }
    router.push('/dashboard');
  };

  // Feedback screen
  if (phase === 'feedback' && gameResult) {
    const stressChange = apiStressLevel - postStress;
    
    return (
      <div className="page-container">
        <div className="feedback-card">
          <div className="feedback-emoji">🎣</div>
          <h1 className="feedback-title">Great Fishing!</h1>
          
          <div className="feedback-stats">
            <div className="feedback-stat">
              <span className="feedback-stat-label">Score</span>
              <span className="feedback-stat-value">{gameResult.score}</span>
            </div>
            <div className="feedback-stat">
              <span className="feedback-stat-label">Calm Score</span>
              <span className="feedback-stat-value">{gameResult.calmScore}%</span>
            </div>
          </div>
          
          <div className="feedback-stress-info">
            <span>AI detected stress: <strong>{apiStressLevel}/100</strong></span>
            <span> → Mode: <strong>
              {difficulty === 'calm' ? '🌿 Calm' : difficulty === 'focus' ? '🎯 Focus' : '⚖️ Normal'}
            </strong></span>
          </div>
          
          <p className="feedback-question">How stressed do you feel now after playing?</p>
          
          <div className="feedback-slider-container">
            <div className="feedback-slider-labels">
              <span>😌</span>
              <span className="feedback-slider-value">{postStress}</span>
              <span>😰</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={postStress}
              onChange={(e) => setPostStress(Number(e.target.value))}
              className="slider"
            />
            <div className="feedback-slider-text">
              <span>Very Calm</span>
              <span>Very Stressed</span>
            </div>
          </div>
          
          {stressChange > 0 ? (
            <div className="feedback-message success">
              ✨ Your stress decreased by {stressChange} points!
            </div>
          ) : (
            <div className="feedback-message info">
              That's okay! Sometimes relaxation takes time. 🌟
            </div>
          )}
          
          <button onClick={submitFeedback} className="btn btn-primary feedback-btn">
            Continue to Dashboard
          </button>
        </div>

        <style jsx>{`
          .page-container {
            min-height: 100vh;
            padding: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .feedback-card {
            background: var(--bg-card);
            border: 1px solid var(--accent-soft);
            border-radius: 20px;
            padding: 2.5rem;
            max-width: 500px;
            width: 100%;
            text-align: center;
            animation: slideUp 0.4s ease-out;
          }
          
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .feedback-emoji {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          
          .feedback-title {
            font-size: 2rem;
            color: var(--accent);
            margin: 0 0 1.5rem 0;
          }
          
          .feedback-stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin-bottom: 1.5rem;
          }
          
          .feedback-stat {
            display: flex;
            flex-direction: column;
          }
          
          .feedback-stat-label {
            font-size: 0.85rem;
            color: var(--text-muted);
          }
          
          .feedback-stat-value {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--text);
          }
          
          .feedback-stress-info {
            background: var(--bg-dark);
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
            color: var(--text-muted);
            margin-bottom: 1.5rem;
          }
          
          .feedback-stress-info strong {
            color: var(--accent);
          }
          
          .feedback-question {
            color: var(--text-muted);
            margin-bottom: 1rem;
          }
          
          .feedback-slider-container {
            margin-bottom: 1.5rem;
          }
          
          .feedback-slider-labels {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
          }
          
          .feedback-slider-labels span:first-child,
          .feedback-slider-labels span:last-child {
            font-size: 1.5rem;
          }
          
          .feedback-slider-value {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--accent);
          }
          
          .feedback-slider-container :global(.slider) {
            width: 100%;
          }
          
          .feedback-slider-text {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-top: 0.5rem;
          }
          
          .feedback-message {
            padding: 1rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            font-weight: 600;
          }
          
          .feedback-message.success {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
            color: #22c55e;
          }
          
          .feedback-message.info {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: #f59e0b;
          }
          
          .feedback-btn {
            width: 100%;
            padding: 1rem;
            font-size: 1.1rem;
          }
        `}</style>
      </div>
    );
  }

  // Playing phase - show game
  return (
    <div className="page-container">
      <GameFrame
        title="🎣 Fishing"
        subtitle="Press SPACE when the bobber is in the green zone. Press P to pause."
        showMode
        mode={difficulty}
      >
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
        
        {/* End modal overlay */}
        {phase === 'ended' && gameResult && (
          <EndModal
            show={true}
            score={gameResult.score}
            calmScore={gameResult.calmScore}
            saving={saving}
            message="Nice catch!"
          />
        )}
      </GameFrame>

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
