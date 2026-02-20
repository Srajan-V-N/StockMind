import { NextRequest, NextResponse } from 'next/server';

const FX_API = 'https://api.exchangerate-api.com/v4/latest';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from') || 'USD';
    const to = searchParams.get('to') || 'USD';
    const amount = parseFloat(searchParams.get('amount') || '1');

    if (from === to) {
      return NextResponse.json({
        rate: 1,
        converted: amount,
      });
    }

    const response = await fetch(`${FX_API}/${from}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates[to];

    if (!rate) {
      return NextResponse.json(
        { error: 'Invalid currency code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      rate,
      converted: amount * rate,
    });
  } catch (error) {
    console.error('FX API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 500 }
    );
  }
}
