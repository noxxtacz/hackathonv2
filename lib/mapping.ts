import { Difficulty } from './types';

/**
 * Map a stress level (0-100) to a game difficulty
 * - High stress (67-100): calm mode (easier, more relaxing to help destress)
 * - Medium stress (34-66): normal mode
 * - Low stress (0-33): focus mode (can handle more challenge)
 */
export function mapStressToDifficulty(stressLevel: number): Difficulty {
  if (stressLevel >= 67) {
    return 'calm'; // High stress = easier game to help relax
  } else if (stressLevel >= 34) {
    return 'normal';
  } else {
    return 'focus'; // Low stress = can handle more challenge
  }
}

/**
 * Get game parameters based on difficulty
 */
export function getDifficultyParams(difficulty: Difficulty) {
  switch (difficulty) {
    case 'calm':
      return {
        speed: 0.5,        // Slower fireflies
        size: 30,          // Bigger hitbox
        spawnRate: 2000,   // Spawn every 2 seconds
        duration: 60,      // 60 seconds
        maxFireflies: 5,   // Fewer on screen
      };
    case 'normal':
      return {
        speed: 1.0,
        size: 24,
        spawnRate: 1500,
        duration: 50,
        maxFireflies: 8,
      };
    case 'focus':
      return {
        speed: 1.5,        // Faster
        size: 18,          // Smaller hitbox
        spawnRate: 1000,   // More frequent spawns
        duration: 45,
        maxFireflies: 12,
      };
  }
}
