import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const name = searchParams.get('name') || '';

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/sentiment?symbol=${encodeURIComponent(symbol)}&name=${encodeURIComponent(name)}`,
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Sentiment API error:', error);
    return NextResponse.json(
      { mood: 'neutral', summary: 'Sentiment service unavailable.', positive_pct: 0, neutral_pct: 100, negative_pct: 0, mixed_pct: 0, article_count: 0, classified_articles: [] },
    );
  }
}
