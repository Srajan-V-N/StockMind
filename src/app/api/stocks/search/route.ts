import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter';
import { getStockLogoUrl } from '@/lib/stockLogos';

export const dynamic = 'force-dynamic';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

// Cache configuration
const SEARCH_CACHE = new Map<string, { data: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiter configuration (increased from 10 to 30 for better UX)
const limiter = new RateLimiter({
  maxRequests: 30,      // Max 30 requests (same as crypto search)
  windowMs: 60 * 1000,  // Per minute
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 1) {
      return NextResponse.json([]);
    }

    // Check rate limit
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'anonymous';

    if (!limiter.check(clientIp)) {
      return NextResponse.json(
        {
          error: 'Too many search requests. Please wait a moment.',
          type: 'rate_limit'
        },
        { status: 429 }
      );
    }

    // Check cache first
    const cacheKey = query.toLowerCase();
    const cached = SEARCH_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached search results for:', query);
      return NextResponse.json(cached.data);
    }

    // Call Python HTTP server instead of spawning process
    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/search?query=${encodeURIComponent(query)}`,
      {
        signal: AbortSignal.timeout(15000), // 15s timeout
        cache: 'no-store', // Disable Next.js Data Cache
      }
    );

    if (!response.ok) {
      console.error(`Python server returned ${response.status}`);
      return NextResponse.json(
        {
          error: 'Failed to search stocks',
          type: 'server_error'
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Handle error object from Python
    if (result.error) {
      console.error('Search error from Python:', result.error);
      return NextResponse.json(
        { error: result.error, type: result.type || 'unknown' },
        { status: 400 }
      );
    }

    // Add logos to search results
    const resultsWithLogos = Array.isArray(result)
      ? result.map((stock: any) => ({
          ...stock,
          logo: getStockLogoUrl(stock.symbol, stock.name),
        }))
      : result;

    // Cache successful results
    if (Array.isArray(resultsWithLogos) && resultsWithLogos.length > 0) {
      SEARCH_CACHE.set(cacheKey, {
        data: resultsWithLogos,
        timestamp: Date.now()
      });
    }

    return NextResponse.json(resultsWithLogos);

  } catch (error: any) {
    console.error('Stock search error:', error);

    // Check if Python server is not running
    if (error?.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error: 'Python server is not running',
          type: 'connection_error'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to search stocks. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
