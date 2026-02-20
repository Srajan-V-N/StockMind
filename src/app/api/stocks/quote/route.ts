import { NextRequest, NextResponse } from 'next/server';
import { getStockLogoUrl } from '@/lib/stockLogos';

export const dynamic = 'force-dynamic';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Call Python HTTP server instead of spawning process
    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/quote?symbol=${encodeURIComponent(symbol)}`,
      {
        signal: AbortSignal.timeout(15000), // 15s timeout
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error(`Python server returned ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch stock quote' },
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

    // Add company logo URL
    const logo = getStockLogoUrl(symbol, result.name);

    return NextResponse.json({
      ...result,
      logo,
    });
  } catch (error: any) {
    console.error('Stock quote error:', error);

    // Check if Python server is not running
    if (error?.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Python server is not running. Please start it with: python python/server.py' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch stock quote' },
      { status: 500 }
    );
  }
}
