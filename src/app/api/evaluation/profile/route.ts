import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const response = await fetch(`${PYTHON_SERVER_URL}/api/evaluation/profile`, {
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    if (error?.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: 'Python server is not running' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
