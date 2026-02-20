import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';

// Cache for budget exploration results (5 minutes)
const explorationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Budget-Based Exploration API
 *
 * Per Prompt.md Section 9 and B.md Section 8:
 * - Shows assets whose current price falls within user-defined budget
 * - Groups results by market cap range
 * - STRICTLY educational and informational
 * - NO ranking as "best"
 * - NO buy/sell messaging
 * - NO future claims
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const budget = parseFloat(searchParams.get('budget') || '0');
    const currency = searchParams.get('currency') || 'USD';
    const market = searchParams.get('market') || 'US'; // US, India, crypto
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!budget || budget <= 0) {
      return NextResponse.json(
        { error: 'Valid budget parameter is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${budget}-${currency}-${market}-${page}`;
    const cached = explorationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    let assets: ExplorationAsset[] = [];

    if (market === 'crypto') {
      // Fetch crypto assets from CoinGecko
      assets = await fetchCryptoAssetsWithinBudget(budget, currency, page, limit);
    } else {
      // Fetch stock assets
      assets = await fetchStockAssetsWithinBudget(budget, currency, market, page, limit);
    }

    // Group by market cap range
    const grouped = groupByMarketCap(assets);

    const result = {
      success: true,
      data: {
        budget,
        currency,
        market,
        totalAssets: assets.length,
        groupedByMarketCap: grouped,
        assets: assets.slice(0, limit),
        // Educational disclaimer - required per CLAUDE.md
        disclaimer: "This is for educational exploration only. Past performance does not indicate future results. This is NOT investment advice."
      }
    };

    // Cache result
    explorationCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Budget exploration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to explore assets within budget',
        disclaimer: "This is for educational exploration only. NOT investment advice."
      },
      { status: 500 }
    );
  }
}

interface ExplorationAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  marketCapRange: 'large' | 'mid' | 'small' | 'micro';
  type: 'stock' | 'crypto';
  currency: string;
  logo?: string;
}

async function fetchCryptoAssetsWithinBudget(
  budget: number,
  currency: string,
  page: number,
  limit: number
): Promise<ExplorationAsset[]> {
  try {
    // Fetch crypto markets from CoinGecko
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency.toLowerCase()}&order=market_cap_desc&per_page=250&page=1&sparkline=false`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status);
      return [];
    }

    const coins = await response.json();

    // Filter by budget
    const withinBudget = coins
      .filter((coin: any) => coin.current_price && coin.current_price <= budget)
      .map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change: coin.price_change_24h || 0,
        changePercent: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap,
        marketCapRange: getMarketCapRange(coin.market_cap),
        type: 'crypto' as const,
        currency: currency.toUpperCase(),
        logo: coin.image,
      }));

    return withinBudget;
  } catch (error) {
    console.error('Error fetching crypto assets:', error);
    return [];
  }
}

async function fetchStockAssetsWithinBudget(
  budget: number,
  currency: string,
  market: string,
  page: number,
  limit: number
): Promise<ExplorationAsset[]> {
  try {
    // Get market movers and popular stocks that might be within budget
    const response = await fetch(
      `${PYTHON_SERVER_URL}/api/summary?market=${market}`,
      { signal: AbortSignal.timeout(15000) }
    );

    if (!response.ok) {
      console.error('Python server error:', response.status);
      return [];
    }

    const data = await response.json();

    // Collect all stocks from gainers, losers, mostActive
    const allStocks = [
      ...(data.gainers || []),
      ...(data.losers || []),
      ...(data.mostActive || []),
    ];

    // Filter by budget and deduplicate
    const seen = new Set<string>();
    const withinBudget: ExplorationAsset[] = [];

    for (const stock of allStocks) {
      if (seen.has(stock.symbol)) continue;
      seen.add(stock.symbol);

      if (stock.price && stock.price <= budget && stock.price > 0) {
        withinBudget.push({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          price: stock.price,
          change: stock.change || 0,
          changePercent: stock.changePercent || 0,
          marketCap: stock.marketCap,
          marketCapRange: getMarketCapRange(stock.marketCap),
          type: 'stock' as const,
          currency: currency.toUpperCase(),
        });
      }
    }

    // If we don't have enough stocks, try fetching some well-known affordable stocks IN PARALLEL
    if (withinBudget.length < 5 && budget >= 10) {
      const additionalSymbols = market === 'India'
        ? ['YESBANK.NS', 'IDEA.NS', 'SUZLON.NS', 'PNB.NS', 'IRFC.NS']
        : ['F', 'T', 'INTC', 'WBD', 'RIVN', 'PLTR', 'SOFI', 'NIO'];

      // Filter out already seen symbols
      const symbolsToFetch = additionalSymbols.filter(s => !seen.has(s));

      // Fetch all quotes in PARALLEL (performance fix)
      const quotePromises = symbolsToFetch.map(async (symbol) => {
        try {
          const quoteRes = await fetch(
            `${PYTHON_SERVER_URL}/api/quote?symbol=${symbol}`,
            { signal: AbortSignal.timeout(5000) }
          );

          if (quoteRes.ok) {
            const quote = await quoteRes.json();
            if (!quote.error && quote.price && quote.price <= budget) {
              return {
                symbol: quote.symbol,
                name: quote.name || symbol,
                price: quote.price,
                change: quote.change || 0,
                changePercent: quote.changePercent || 0,
                marketCap: quote.marketCap,
                marketCapRange: getMarketCapRange(quote.marketCap),
                type: 'stock' as const,
                currency: quote.currency || currency.toUpperCase(),
              };
            }
          }
          return null;
        } catch {
          return null;
        }
      });

      const results = await Promise.all(quotePromises);

      // Add valid results up to the limit
      for (const result of results) {
        if (result && withinBudget.length < limit && !seen.has(result.symbol)) {
          seen.add(result.symbol);
          withinBudget.push(result as ExplorationAsset);
        }
      }
    }

    return withinBudget;
  } catch (error) {
    console.error('Error fetching stock assets:', error);
    return [];
  }
}

function getMarketCapRange(marketCap: number | undefined): 'large' | 'mid' | 'small' | 'micro' {
  if (!marketCap) return 'micro';

  if (marketCap >= 10_000_000_000) return 'large';      // $10B+
  if (marketCap >= 2_000_000_000) return 'mid';         // $2B - $10B
  if (marketCap >= 300_000_000) return 'small';         // $300M - $2B
  return 'micro';                                        // < $300M
}

function groupByMarketCap(assets: ExplorationAsset[]): Record<string, ExplorationAsset[]> {
  const groups: Record<string, ExplorationAsset[]> = {
    large: [],
    mid: [],
    small: [],
    micro: [],
  };

  for (const asset of assets) {
    groups[asset.marketCapRange].push(asset);
  }

  return groups;
}
