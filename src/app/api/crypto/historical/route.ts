import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const dynamic = 'force-dynamic';

// Cache historical data for 5 minutes (same as competitors route)
const HISTORICAL_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const range = searchParams.get('range') || '1M';

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `${id}-${range}`;
    const cached = HISTORICAL_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Returning cached historical data for:', cacheKey);
      return NextResponse.json(cached.data);
    }

    // Map our ranges to CoinGecko days
    const daysMap: Record<string, string> = {
      '1D': '1',
      '5D': '5',
      '1M': '30',
      '6M': '180',
      '1Y': '365',
      'MAX': 'max',
    };

    const days = daysMap[range] || '30';

    const url = `${COINGECKO_API}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
    const response = await fetch(url);

    if (!response.ok) {
      const status = response.status;
      console.error('CoinGecko API error:', { status, url, id, days });

      if (status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }

      if (status === 404) {
        return NextResponse.json(
          { error: 'Cryptocurrency not found.' },
          { status: 404 }
        );
      }

      throw new Error(`CoinGecko API responded with status ${status}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.prices || !Array.isArray(data.prices) || data.prices.length === 0) {
      console.error('Invalid CoinGecko response:', { id, data });
      throw new Error('Invalid API response format');
    }

    // Transform to chart data format
    const chartData = data.prices.map((item: [number, number]) => ({
      time: new Date(item[0]).toISOString(),
      value: item[1],
    }));

    const result = { data: chartData };

    // Cache the result
    HISTORICAL_CACHE.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    console.log('🌐 Fetched fresh historical data for:', cacheKey);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Crypto historical error:', error.message);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
