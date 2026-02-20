import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const days = searchParams.get('days') || '30';

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/sentiment/history?symbol=${encodeURIComponent(symbol)}&days=${days}`,
    );
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Sentiment history API error:', error);
    return NextResponse.json({ history: [] });
  }
}
