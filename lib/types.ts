export type Mood = 'calm' | 'neutral' | 'tired' | 'stressed';
export type Difficulty = 'calm' | 'normal' | 'focus';
export type GameType = 'fireflies' | 'glide' | 'fishing' | 'farm';

export interface Analysis {
  mood: Mood;
  stressLevel: number; // 0-100
  keywords: string[];
  suggestion: string;
  summary: string;
}

export interface GameResult {
  type: GameType;
  difficulty: Difficulty;
  score: number;
  calmScore: number; // 0-100
  durationSec: number;
  selfReportedBefore?: number; // User's self-reported stress before (0-100)
  selfReportedAfter?: number; // User's self-reported stress after (0-100)
  happinessGain?: number; // Calculated improvement percentage
}

export interface Session {
  id: string;
  createdAt: string; // ISO date string
  logText: string;
  analysis: Analysis | null;
  game: GameResult | null;
}

export interface AnalyzeResponse {
  mood: Mood;
  stressLevel: number;
  keywords: string[];
  summary: string;
  suggestion: string;
}

// Motivational quotes based on mood
export const MOTIVATIONAL_QUOTES: Record<Mood, string[]> = {
  calm: [
    "You're doing great! Keep this peaceful energy.",
    "Breathe in the calm, breathe out the tension.",
    "This moment is yours. Enjoy the serenity.",
    "Your mind is clear and focused.",
    "Feel the tranquility flowing through you.",
  ],
  neutral: [
    "Take your time, there's no rush.",
    "Every small step counts.",
    "You're exactly where you need to be.",
    "Let the rhythm guide you.",
    "Stay present in this moment.",
  ],
  tired: [
    "Rest is part of progress.",
    "It's okay to take things slow.",
    "You're stronger than you think.",
    "Energy will return, be gentle with yourself.",
    "Small efforts are still efforts.",
  ],
  stressed: [
    "You've got this. One breath at a time.",
    "This too shall pass.",
    "You're more capable than you realize.",
    "Release what you cannot control.",
    "You're safe here. Let the stress melt away.",
  ],
};

// Audio tracks organized by stress level
export const AUDIO_TRACKS = {
  calm: ['calm1.mp3', 'calm2.mp3', 'calm3.mp3'],
  normal: ['balanced1.mp3', 'balanced2.mp3'],
  stressed: ['focus1.mp3', 'focus2.mp3', 'focus3.mp3'],
};

// Fishing game configuration
export interface FishingConfig {
  durationSec: number;
  zoneHeight: number;
  bobberSpeed: number;
  zoneDriftSpeed: number;
  cooldownMs: number;
  successWindowPadding: number;
}

export function getFishingConfig(difficulty: Difficulty): FishingConfig {
  switch (difficulty) {
    case 'calm':
      return {
        durationSec: 60,
        zoneHeight: 120,
        bobberSpeed: 80,
        zoneDriftSpeed: 30,
        cooldownMs: 800,
        successWindowPadding: 10,
      };
    case 'focus':
      return {
        durationSec: 45,
        zoneHeight: 60,
        bobberSpeed: 140,
        zoneDriftSpeed: 60,
        cooldownMs: 1200,
        successWindowPadding: 0,
      };
    case 'normal':
    default:
      return {
        durationSec: 50,
        zoneHeight: 90,
        bobberSpeed: 110,
        zoneDriftSpeed: 45,
        cooldownMs: 1000,
        successWindowPadding: 5,
      };
  }
}
