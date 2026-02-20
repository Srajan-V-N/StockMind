import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Rate limiter: 30 requests per minute (more generous than stocks)
const limiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous';

    if (!limiter.check(clientIp)) {
      return NextResponse.json(
        { error: 'Too many search requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    // Return empty array for invalid/short queries instead of error
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const response = await fetch(
      `${COINGECKO_API}/search?query=${encodeURIComponent(query)}`,
      {
        next: { revalidate: 300 },  // 5 min cache
        signal: AbortSignal.timeout(8000),
      }
    );

    // Return empty array on API failure instead of throwing
    if (!response.ok) {
      console.warn(`CoinGecko search API returned ${response.status}`);
      return NextResponse.json([]);
    }

    const data = await response.json();
    const coins = data.coins || [];

    // Get top 10 coins from search
    const topCoins = coins.slice(0, 10);

    // If no coins found, return empty array
    if (topCoins.length === 0) {
      return NextResponse.json([]);
    }

    // Use coins/markets endpoint to fetch all data in a single call (optimization: 10 calls → 1 call)
    const coinIds = topCoins.map((coin: any) => coin.id).join(',');

    try {
      const marketsResponse = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
        { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) }
      );

      if (!marketsResponse.ok) {
        console.warn(`CoinGecko markets API returned ${marketsResponse.status}`);
        // Return basic coin info without price data as fallback
        return NextResponse.json(
          topCoins.map((coin: any) => ({
            id: coin.id,
            symbol: coin.symbol?.toUpperCase() || '',
            name: coin.name || '',
            price: 0,
            change24h: 0,
            changePercent24h: 0,
            marketCap: 0,
            image: coin.large || coin.thumb || '',
          }))
        );
      }

      const marketsData = await marketsResponse.json();

      // Filter and validate results - only show coins with valid market data
      const validResults = marketsData
        .filter((coin: any) => {
          // Must have valid ID and price
          if (!coin.id || coin.current_price === null || coin.current_price === undefined) {
            console.warn(`Filtered out invalid coin: ${coin.id || 'unknown'}`);
            return false;
          }
          return true;
        })
        .map((coin: any) => ({
          id: coin.id,  // Guaranteed valid from markets endpoint
          symbol: coin.symbol?.toUpperCase() || '',
          name: coin.name || '',
          price: coin.current_price || 0,
          change24h: coin.price_change_24h || 0,
          changePercent24h: coin.price_change_percentage_24h || 0,
          marketCap: coin.market_cap || 0,
          image: coin.image,
        }));

      return NextResponse.json(validResults);
    } catch (error) {
      console.error('Failed to fetch markets data:', error);
      // Return basic coin info without price data as fallback
      return NextResponse.json(
        topCoins.map((coin: any) => ({
          id: coin.id,
          symbol: coin.symbol?.toUpperCase() || '',
          name: coin.name || '',
          price: 0,
          change24h: 0,
          changePercent24h: 0,
          marketCap: 0,
          image: coin.large || coin.thumb || '',
        }))
      );
    }
  } catch (error) {
    console.error('Crypto search error:', error);
    // Return empty array instead of 500 error
    return NextResponse.json([]);
  }
}
