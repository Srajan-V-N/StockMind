import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const dynamic = 'force-dynamic';

// Cache price data for 1 minute (more frequent updates for real-time prices)
const PRICE_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = PRICE_CACHE.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Returning cached price data for:', id);
      return NextResponse.json(cached.data);
    }

    const url = `${COINGECKO_API}/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`;
    const response = await fetch(url);

    if (!response.ok) {
      const status = response.status;
      console.error('CoinGecko API error:', { status, url, id });

      if (status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }

      if (status === 404) {
        console.error(`CoinGecko 404: Coin ID "${id}" not found`);
        return NextResponse.json(
          {
            error: 'Cryptocurrency not found.',
            id: id,
            suggestion: 'This coin may have been delisted or the ID is invalid.'
          },
          { status: 404 }
        );
      }

      throw new Error(`CoinGecko API responded with status ${status}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.market_data) {
      console.error('Invalid CoinGecko response:', { id, data });
      throw new Error('Invalid API response format');
    }

    const result = {
      id: data.id,
      symbol: data.symbol?.toUpperCase() || '',
      name: data.name || '',
      price: data.market_data?.current_price?.usd || 0,
      change24h: data.market_data?.price_change_24h || 0,
      changePercent24h: data.market_data?.price_change_percentage_24h || 0,
      high24h: data.market_data?.high_24h?.usd || 0,
      low24h: data.market_data?.low_24h?.usd || 0,
      marketCap: data.market_data?.market_cap?.usd || 0,
      volume: data.market_data?.total_volume?.usd || 0,
      circulatingSupply: data.market_data?.circulating_supply || 0,
      totalSupply: data.market_data?.total_supply || undefined,
      allTimeHigh: data.market_data?.ath?.usd || undefined,
      allTimeLow: data.market_data?.atl?.usd || undefined,
      image: data.image?.large || data.image?.small,
      description: data.description?.en || undefined,
    };

    // Cache the result
    PRICE_CACHE.set(id, {
      data: result,
      timestamp: Date.now(),
    });

    console.log('🌐 Fetched fresh price data for:', id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Crypto price error:', error.message);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch cryptocurrency data' },
      { status: 500 }
    );
  }
}
