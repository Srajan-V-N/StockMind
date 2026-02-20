import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const range = searchParams.get('range') || '1M';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Call Python HTTP server instead of spawning process
    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/historical?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`,
      {
        signal: AbortSignal.timeout(15000), // 15s timeout
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error(`Python server returned ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch historical data' },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Stock historical error:', error);

    // Check if Python server is not running
    if (error?.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Python server is not running. Please start it with: python python/server.py' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
