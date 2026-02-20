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

    const params = new URLSearchParams({ symbol });
    if (name) params.set('name', name);

    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/sentiment/divergence?${params}`,
      { cache: 'no-store' }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Divergence API error:', error);
    return NextResponse.json({
      symbol: '',
      signal: 'neutral',
      label: 'Unavailable',
      description: 'Could not compute divergence at this time.',
      price_change_30d_pct: 0,
      sentiment_mood: 'neutral',
      positive_pct: 0,
      negative_pct: 0,
      educational_only: true,
    });
  }
}
