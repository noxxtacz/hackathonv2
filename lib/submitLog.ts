import { addSession, generateSessionId } from './storage';
import { AnalyzeResponse } from './types';

/**
 * Submit a log entry for analysis and create a new session
 */
export async function submitLog(logText: string): Promise<void> {
  // Call the analyze API
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ logText }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze log');
  }

  const analysis: AnalyzeResponse = await response.json();

  // Create and save the session
  const session = {
    id: generateSessionId(),
    createdAt: new Date().toISOString(),
    logText,
    analysis: {
      mood: analysis.mood,
      stressLevel: analysis.stressLevel,
      keywords: analysis.keywords,
      summary: analysis.summary,
      suggestion: analysis.suggestion,
    },
    game: null, // Will be filled after mini-game
  };

  addSession(session);
}
