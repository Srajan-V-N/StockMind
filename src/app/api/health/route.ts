import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://127.0.0.1:8000/health', {
      signal: AbortSignal.timeout(2000),
    });

    if (response.ok) {
      return NextResponse.json({ status: 'ok' });
    }

    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  }
}
