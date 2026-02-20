import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/db/checklists?limit=${limit}&offset=${offset}`,
      { signal: AbortSignal.timeout(10000), cache: 'no-store' }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch checklists' }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    if (error?.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: 'Python server is not running' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch checklists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${PYTHON_SERVER_URL}/api/db/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: result.detail || 'Failed to save checklist' }, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (error?.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: 'Python server is not running' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to save checklist' }, { status: 500 });
  }
}
