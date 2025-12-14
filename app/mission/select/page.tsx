'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLatestSession } from '@/lib/storage';
import { mapStressToDifficulty } from '@/lib/mapping';

export default function SelectGamePage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<'calm' | 'normal' | 'focus'>('normal');
  const [mood, setMood] = useState<'calm' | 'neutral' | 'tired' | 'stressed'>('neutral');
  const [stressLevel, setStressLevel] = useState(50);

  useEffect(() => {
    const session = getLatestSession();
    if (session?.analysis) {
      setMood(session.analysis.mood);
      setStressLevel(session.analysis.stressLevel);
      setDifficulty(mapStressToDifficulty(session.analysis.stressLevel));
    }
  }, []);

  const getMoodEmoji = () => {
    switch (mood) {
      case 'calm': return '😌';
      case 'tired': return '😴';
      case 'stressed': return '😰';
      default: return '😊';
    }
  };

  const getDifficultyInfo = () => {
    switch (difficulty) {
      case 'calm': 
        return { emoji: '🌿', label: 'Calm Mode', description: 'Slower pace, more relaxing' };
      case 'focus': 
        return { emoji: '🎯', label: 'Focus Mode', description: 'More engaging, faster pace' };
      default: 
        return { emoji: '⚖️', label: 'Normal Mode', description: 'Balanced gameplay' };
    }
  };

  const missions = [
    {
      id: 'firefly',
      name: 'Firefly Forest',
      description: 'Catch gentle fireflies in a peaceful meadow',
      emoji: '✨',
      route: '/mission',
    },
    {
      id: 'fishing',
      name: 'Tranquil Fishing',
      description: 'Catch fish in a calming rhythm mini-game',
      emoji: '🎣',
      route: '/mission/fishing',
    },
    {
      id: 'glide',
      name: 'Cloud Gliding',
      description: 'Soar through serene skies and collect lanterns',
      emoji: '🌙',
      route: '/mission/glide',
    },
  ];

  const handleMissionSelect = (route: string) => {
    router.push(route);
  };

  const difficultyInfo = getDifficultyInfo();

  return (
    <div className="select-page">
      <h1 className="page-title">🎯 Choose Your Activity</h1>

      {/* Recommended Mode Banner */}
      <div className="mode-banner">
        <div className="mode-banner-header">
          <span className="mode-emoji">{difficultyInfo.emoji}</span>
          <div className="mode-text">
            <span className="mode-label">Recommended: {difficultyInfo.label}</span>
            <span className="mode-description">{difficultyInfo.description}</span>
          </div>
        </div>
        <div className="mode-stress">
          <span className="mood-emoji">{getMoodEmoji()}</span>
          <span className="stress-text">AI detected stress: {stressLevel}%</span>
        </div>
      </div>

      {/* Mission Cards */}
      <div className="missions-grid">
        {missions.map((mission) => (
          <button
            key={mission.id}
            className="mission-card"
            onClick={() => handleMissionSelect(mission.route)}
          >
            <div className="mission-emoji">{mission.emoji}</div>
            <h3 className="mission-name">{mission.name}</h3>
            <p className="mission-description">{mission.description}</p>
            <span className="mission-play">Play →</span>
          </button>
        ))}
      </div>

      <p className="help-text">
        All games will use <strong>{difficultyInfo.label}</strong> based on your journal analysis.
      </p>

      <style jsx>{`
        .select-page {
          min-height: 100vh;
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .page-title {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .mode-banner {
          background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-dark) 100%);
          border: 2px solid var(--accent);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        @media (min-width: 600px) {
          .mode-banner {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        
        .mode-banner-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .mode-emoji {
          font-size: 2.5rem;
        }
        
        .mode-text {
          display: flex;
          flex-direction: column;
        }
        
        .mode-label {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--accent);
        }
        
        .mode-description {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        
        .mode-stress {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-dark);
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }
        
        .mood-emoji {
          font-size: 1.25rem;
        }
        
        .stress-text {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        
        .missions-grid {
          display: grid;
          gap: 1rem;
        }
        
        @media (min-width: 600px) {
          .missions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        .mission-card {
          background: var(--bg-card);
          border: 1px solid var(--accent-soft);
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: inherit;
          font-family: inherit;
        }
        
        .mission-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
          box-shadow: 0 8px 24px rgba(155, 89, 182, 0.2);
        }
        
        .mission-card:active {
          transform: translateY(-2px);
        }
        
        .mission-emoji {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }
        
        .mission-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--accent);
          margin: 0 0 0.5rem 0;
        }
        
        .mission-description {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0 0 1rem 0;
          line-height: 1.4;
          flex-grow: 1;
        }
        
        .mission-play {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--accent);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          background: var(--bg-dark);
          transition: background 0.2s;
        }
        
        .mission-card:hover .mission-play {
          background: var(--accent);
          color: white;
        }
        
        .help-text {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-top: 1.5rem;
        }
        
        .help-text strong {
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}
