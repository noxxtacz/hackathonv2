import { AnalyzeResponse, Mood } from './types';

/**
 * Fallback analyzer using keyword matching
 * Used when the AI API fails or is unavailable
 */
export function fallbackAnalyzer(logText: string): AnalyzeResponse {
  const text = logText.toLowerCase();

  // Keyword categories
  const stressKeywords = [
    'stressed', 'stress', 'anxious', 'anxiety', 'worried', 'worry',
    'overwhelmed', 'pressure', 'deadline', 'panic', 'nervous',
    'frustrated', 'angry', 'upset', 'difficult', 'hard', 'struggle',
    'exhausted', 'burned out', 'burnout', 'too much', 'can\'t cope',
    'depressed', 'depression', 'sad', 'sadness', 'unhappy', 'miserable',
    'lonely', 'alone', 'hopeless', 'helpless', 'terrible', 'awful',
    'crying', 'cry', 'hurt', 'pain', 'suffering', 'down', 'low',
    'feeling bad', 'not okay', 'not good', 'not well'
  ];

  const calmKeywords = [
    'calm', 'peaceful', 'relaxed', 'happy', 'content', 'grateful',
    'thankful', 'blessed', 'wonderful', 'great', 'amazing', 'good',
    'joy', 'love', 'excited', 'positive', 'hopeful', 'proud',
    'accomplished', 'satisfied', 'pleased', 'cheerful', 'delighted'
  ];

  const tiredKeywords = [
    'tired', 'exhausted', 'sleepy', 'fatigue', 'drained', 'worn out',
    'no energy', 'low energy', 'sluggish', 'lazy', 'unmotivated'
  ];

  const neutralKeywords = [
    'okay', 'fine', 'alright', 'normal', 'usual', 'regular',
    'nothing special', 'average', 'so-so'
  ];

  // Count keyword matches
  let stressCount = 0;
  let calmCount = 0;
  let tiredCount = 0;
  let neutralCount = 0;
  const foundKeywords: string[] = [];

  stressKeywords.forEach(kw => {
    if (text.includes(kw)) {
      stressCount++;
      if (foundKeywords.length < 5 && !foundKeywords.includes(kw)) {
        foundKeywords.push(kw);
      }
    }
  });

  calmKeywords.forEach(kw => {
    if (text.includes(kw)) {
      calmCount++;
      if (foundKeywords.length < 5 && !foundKeywords.includes(kw)) {
        foundKeywords.push(kw);
      }
    }
  });

  tiredKeywords.forEach(kw => {
    if (text.includes(kw)) {
      tiredCount++;
      if (foundKeywords.length < 5 && !foundKeywords.includes(kw)) {
        foundKeywords.push(kw);
      }
    }
  });

  neutralKeywords.forEach(kw => {
    if (text.includes(kw)) {
      neutralCount++;
    }
  });

  // Determine mood
  let mood: Mood = 'neutral';
  let stressLevel = 50;

  const maxCount = Math.max(stressCount, calmCount, tiredCount, neutralCount);

  if (maxCount === 0 || neutralCount === maxCount) {
    mood = 'neutral';
    stressLevel = 50;
  } else if (stressCount === maxCount) {
    mood = 'stressed';
    stressLevel = Math.min(100, 60 + stressCount * 10);
  } else if (tiredCount === maxCount) {
    mood = 'tired';
    stressLevel = Math.min(80, 40 + tiredCount * 10);
  } else if (calmCount === maxCount) {
    mood = 'calm';
    stressLevel = Math.max(0, 40 - calmCount * 10);
  }

  // Generate summary and suggestion
  const summaries: Record<Mood, string> = {
    calm: 'You seem to be in a positive and peaceful state of mind.',
    neutral: 'Your day appears to have been fairly balanced.',
    tired: 'It sounds like you might be feeling low on energy today.',
    stressed: 'It seems like you\'re going through a difficult time and that\'s okay.',
  };

  const suggestions: Record<Mood, string> = {
    calm: 'Keep enjoying this peaceful moment!',
    neutral: 'Try doing something small that brings you joy.',
    tired: 'Consider taking a short rest or doing some light stretching.',
    stressed: 'Take a few deep breaths. You deserve kindness and support.',
  };

  return {
    mood,
    stressLevel,
    keywords: foundKeywords.length > 0 ? foundKeywords : ['reflection'],
    summary: summaries[mood],
    suggestion: suggestions[mood],
  };
}
