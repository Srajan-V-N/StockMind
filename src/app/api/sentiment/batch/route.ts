import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${PYTHON_SERVER_URL}/api/sentiment/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Sentiment batch API error:', error);
    return NextResponse.json({ sentiments: {} });
  }
}
