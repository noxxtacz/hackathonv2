import { AnalyzeResponse } from './types';

// Groq API Configuration
const GROQ_API_KEY = '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';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Fast and capable model

/**
 * Call Groq API to analyze the log text
 */
export async function callXaiAnalyze(logText: string): Promise<AnalyzeResponse> {
  const systemPrompt = `You are a wellness assistant that analyzes daily journal entries. 
Analyze the user's log and respond with ONLY a valid JSON object (no markdown, no explanation).

The JSON must have exactly these keys:
- "mood": one of "calm", "neutral", "tired", or "stressed"
- "stressLevel": a number from 0 to 100 (0 = very calm, 100 = very stressed)
- "keywords": an array of up to 5 relevant keywords from the text
- "summary": a single sentence summarizing their emotional state
- "suggestion": a short, kind suggestion for self-care (1 sentence)

Example response:
{"mood":"neutral","stressLevel":45,"keywords":["work","meeting","coffee"],"summary":"You had a typical workday with some minor challenges.","suggestion":"Consider taking a short walk to refresh your mind."}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: logText }
      ],
      temperature: 0.7,
      max_tokens: 250,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in Groq response');
  }

  // Parse the JSON response
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    return {
      mood: ['calm', 'neutral', 'tired', 'stressed'].includes(parsed.mood) 
        ? parsed.mood 
        : 'neutral',
      stressLevel: typeof parsed.stressLevel === 'number' 
        ? Math.min(100, Math.max(0, parsed.stressLevel)) 
        : 50,
      keywords: Array.isArray(parsed.keywords) 
        ? parsed.keywords.slice(0, 5) 
        : [],
      summary: typeof parsed.summary === 'string' 
        ? parsed.summary 
        : 'Your log has been analyzed.',
      suggestion: typeof parsed.suggestion === 'string' 
        ? parsed.suggestion 
        : 'Take a moment to breathe.',
    };
  } catch (parseError) {
    throw new Error(`Failed to parse Hugging Face response: ${parseError}`);
  }
}
