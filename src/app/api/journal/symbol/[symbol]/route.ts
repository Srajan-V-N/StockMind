import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/journal/symbol/${encodeURIComponent(symbol)}`,
      { signal: AbortSignal.timeout(10000), cache: 'no-store' }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    if (error?.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: 'Python server is not running' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}
