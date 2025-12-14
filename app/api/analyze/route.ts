import { NextRequest, NextResponse } from 'next/server';
import { callXaiAnalyze } from '@/lib/xai';
import { fallbackAnalyzer } from '@/lib/fallbackAnalyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logText } = body;

    // Validate input
    if (!logText || typeof logText !== 'string') {
      return NextResponse.json(
        { error: 'logText is required and must be a string' },
        { status: 400 }
      );
    }

    if (logText.length === 0) {
      return NextResponse.json(
        { error: 'logText cannot be empty' },
        { status: 400 }
      );
    }

    if (logText.length > 2000) {
      return NextResponse.json(
        { error: 'logText must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // Testing Groq API only - fallback disabled
    const analysis = await callXaiAnalyze(logText);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze log' },
      { status: 500 }
    );
  }
}
