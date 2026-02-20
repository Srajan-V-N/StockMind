import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

export async function POST() {
  try {
    const response = await fetch(`${PYTHON_SERVER_URL}/api/evaluation/report/generate`, {
      method: 'POST',
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to generate report' }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    if (error?.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: 'Python server is not running' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
