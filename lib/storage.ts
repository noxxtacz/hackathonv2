import { Session, GameResult, GameType, Difficulty } from './types';

const STORAGE_KEY = 'nebula-village-sessions';

/**
 * Get all sessions from localStorage
 */
export function getSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Session[];
  } catch {
    console.error('Failed to parse sessions from localStorage');
    return [];
  }
}

/**
 * Save all sessions to localStorage
 */
function saveSessions(sessions: Session[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * Add a new session
 */
export function addSession(session: Session): void {
  const sessions = getSessions();
  sessions.unshift(session); // Add to beginning (newest first)
  saveSessions(sessions);
}

/**
 * Update an existing session by ID - merges deeply
 */
export function updateSession(id: string, patch: Partial<Session>): void {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === id);
  
  if (index !== -1) {
    // Deep merge for nested objects like game
    const existingSession = sessions[index];
    sessions[index] = {
      ...existingSession,
      ...patch,
      // If patch has game data, merge it with existing game data
      game: patch.game ? { ...existingSession.game, ...patch.game } as GameResult : existingSession.game,
    };
    saveSessions(sessions);
    
    // Debug log
    console.log('[Storage] Updated session:', sessions[index]);
  } else {
    console.warn('[Storage] Session not found for id:', id);
  }
}

/**
 * Get the most recent session
 */
export function getLatestSession(): Session | null {
  const sessions = getSessions();
  const latest = sessions.length > 0 ? sessions[0] : null;
  
  // Debug log
  console.log('[Storage] getLatestSession:', latest);
  console.log('[Storage] Latest session game data:', latest?.game);
  
  return latest;
}

/**
 * Update the latest session with game data
 */
export function updateSessionWithGameData(gameData: {
  type: GameType;
  score: number;
  calmScore: number;
  difficulty: Difficulty;
  durationSec: number;
  selfReportedBefore?: number;
  selfReportedAfter?: number;
  happinessGain?: number;
}): void {
  const latestSession = getLatestSession();
  if (latestSession) {
    // Ensure all values are numbers, not strings
    const cleanedData: GameResult = {
      type: gameData.type,
      difficulty: gameData.difficulty,
      score: Number(gameData.score) || 0,
      calmScore: Number(gameData.calmScore) || 0,
      durationSec: Number(gameData.durationSec) || 0,
      selfReportedBefore: gameData.selfReportedBefore !== undefined ? Number(gameData.selfReportedBefore) : undefined,
      selfReportedAfter: gameData.selfReportedAfter !== undefined ? Number(gameData.selfReportedAfter) : undefined,
      happinessGain: gameData.happinessGain !== undefined ? Number(gameData.happinessGain) : undefined,
    };
    
    updateSession(latestSession.id, {
      game: cleanedData,
    });
    
    // Debug log
    console.log('[Storage] Saved game data:', cleanedData);
  } else {
    console.warn('[Storage] No session found to save game data');
  }
}

/**
 * Generate a unique ID for a session
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Re-export types for convenience
export type { Session, GameResult } from './types';
