'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSessions, getLatestSession, Session } from '@/lib/storage';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [latestSession, setLatestSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const allSessions = getSessions();
    const latest = getLatestSession();
    
    setSessions(allSessions);
    setLatestSession(latest);
    
    // Debug logging
    console.log('[Dashboard] All sessions:', allSessions);
    console.log('[Dashboard] Latest session:', latest);
    console.log('[Dashboard] Latest session game data:', latest?.game);
  }, []);

  if (!mounted) {
    return (
      <div className="main-content">
        <h1 className="page-title">📊 Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="main-content">
        <h1 className="page-title">📊 Dashboard</h1>
        <div className="card">
          <div style={{ textAlign: 'center', fontSize: '4rem' }}>🌱</div>
          <h2 style={{ marginTop: '1rem', marginBottom: '1rem' }}>No logs yet!</h2>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
            Start your journey by logging your day.
          </p>
          <Link href="/log" className="btn btn-primary">
            Start Logging
          </Link>
        </div>
      </div>
    );
  }

  // Safely read game data with fallbacks
  const gameData = latestSession?.game;
  const hasGameData = gameData !== null && gameData !== undefined;
  
  // Debug the actual values
  console.log('[Dashboard] gameData:', gameData);
  console.log('[Dashboard] gameData?.score:', gameData?.score);
  console.log('[Dashboard] gameData?.calmScore:', gameData?.calmScore);
  
  const beforeStress = latestSession?.analysis?.stressLevel ?? 0;
  // Read calmScore directly from game data
  const calmScore = hasGameData ? (gameData.calmScore ?? 0) : null;
  const gameScore = hasGameData ? (gameData.score ?? 0) : null;
  
  // Calculate stress after based on self-reported or estimate from calmScore
  const selfReportedAfter = gameData?.selfReportedAfter;
  const afterStress = selfReportedAfter !== undefined 
    ? selfReportedAfter 
    : (calmScore !== null ? Math.max(0, beforeStress - Math.floor(calmScore / 2)) : null);
  const reduction = afterStress !== null ? Math.max(0, beforeStress - afterStress) : 0;

  return (
    <div className="main-content">
      <h1 className="page-title">📊 Dashboard</h1>

      {/* Overview Stats */}
      <div className="overview-grid">
        <div className="stat-card">
          <span className="stat-icon">🧠</span>
          <div className="stat-content">
            <div className="stat-label">Current Mood</div>
            <div className="stat-value">
              {latestSession?.analysis ? (
                <span className={`mood-badge ${latestSession.analysis.mood}`}>
                  {latestSession.analysis.mood}
                </span>
              ) : (
                'N/A'
              )}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">⚡</span>
          <div className="stat-content">
            <div className="stat-label">Stress (Before)</div>
            <div className="stat-value">{beforeStress}%</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">🌿</span>
          <div className="stat-content">
            <div className="stat-label">Calm (After)</div>
            <div className="stat-value">
              {calmScore !== null ? `${calmScore}%` : 'Play a mission'}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-content">
            <div className="stat-label">Total Sessions</div>
            <div className="stat-value">{sessions.length}</div>
          </div>
        </div>
      </div>

      {/* Latest Session */}
      {latestSession && (
        <div className="card">
          <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Latest Session</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {new Date(latestSession.createdAt).toLocaleDateString()}
          </p>

          {latestSession.analysis && (
            <>
              <h3 style={{ marginBottom: '0.5rem' }}>Analysis</h3>
              <p style={{ fontStyle: 'italic', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                "{latestSession.analysis.summary}"
              </p>

              {latestSession.analysis.keywords.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Keywords: </strong>
                  {latestSession.analysis.keywords.join(', ')}
                </div>
              )}

              {latestSession.analysis.suggestion && (
                <div
                  style={{
                    padding: '1rem',
                    background: 'var(--bg-dark)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                  }}
                >
                  <strong>💡 Suggestion: </strong>
                  <span>{latestSession.analysis.suggestion}</span>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Stress Before: </strong>
                  <span>{beforeStress}%</span>
                </div>
                <div className="stat-bar">
                  <div
                    className="stat-bar-fill stressed"
                    style={{ width: `${beforeStress}%` }}
                  ></div>
                </div>
              </div>

              {hasGameData && afterStress !== null && (
                <>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Stress After: </strong>
                    <span>{afterStress}%</span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill calm"
                      style={{ width: `${afterStress}%` }}
                    ></div>
                  </div>

                  {reduction > 0 && (
                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: 'var(--success)',
                        fontWeight: '600',
                      }}
                    >
                      ⬇ Stress reduced by {reduction}%
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {hasGameData ? (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'var(--bg-dark)',
                borderRadius: '8px',
              }}
            >
              <h4 style={{ marginBottom: '0.5rem' }}>🎮 Game Stats</h4>
              <p>
                <strong>Game:</strong> {gameData.type || 'Mission'}
              </p>
              <p>
                <strong>Score:</strong> {gameData.score}
              </p>
              <p>
                <strong>Calm Score:</strong> {gameData.calmScore}/100
              </p>
              <p>
                <strong>Duration:</strong> {gameData.durationSec}s
              </p>
              <p>
                <strong>Difficulty:</strong> {gameData.difficulty}
              </p>
            </div>
          ) : (
            <div
              style={{
                marginTop: '1rem',
                padding: '1.5rem',
                background: 'var(--bg-dark)',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎮</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>No game played yet</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Start a mission to see your game stats here!
              </p>
              <Link href="/mission/select" className="btn btn-secondary" style={{ display: 'inline-block' }}>
                Play a Mission
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Session History */}
      {sessions.length > 1 && (
        <div className="card">
          <h2 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>Recent Sessions</h2>
          <div className="session-list">
            {sessions.slice(1, 6).map((session) => (
              <div key={session.id} className="session-item-enhanced">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {session.analysis
                      ? session.analysis.summary.slice(0, 60) + '...'
                      : session.logText.slice(0, 60) + '...'}
                  </div>
                </div>
                {session.analysis && (
                  <span className={`mood-badge ${session.analysis.mood}`}>
                    {session.analysis.mood}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/log" className="btn btn-primary">
          📝 New Log Entry
        </Link>
      </div>
    </div>
  );
}
