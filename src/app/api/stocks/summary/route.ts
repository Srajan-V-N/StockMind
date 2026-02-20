import { NextRequest, NextResponse } from 'next/server';
import { getStockLogoUrl } from '@/lib/stockLogos';

export const dynamic = 'force-dynamic';

const PYTHON_SERVER_URL = 'http://127.0.0.1:8000';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Helper function to add logos to stock arrays
function addLogosToStocks(stocks: any[]): any[] {
  return stocks.map(stock => ({
    ...stock,
    logo: getStockLogoUrl(stock.symbol, stock.name),
  }));
}

// Fetch crypto data from CoinGecko for crypto market tab
async function fetchCryptoData() {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false`,
      {
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.map((coin: any) => ({
        symbol: coin.id,  // Use ID for routing (bitcoin, ethereum, etc.)
        name: coin.name,
        price: coin.current_price || 0,
        change: coin.price_change_24h || 0,
        changePercent: coin.price_change_percentage_24h || 0,
        image: coin.image,
      }));
    }
  } catch (error) {
    console.error('CoinGecko API error:', error);
  }
  return [];
}

// Fetch currency data - using exchangerate API
async function fetchCurrencyData() {
  // Major currency pairs (against USD)
  const pairs = [
    { symbol: 'USD/INR', name: 'USD / INR', base: 'USD', target: 'INR' },
    { symbol: 'EUR/INR', name: 'EUR / INR', base: 'EUR', target: 'INR' },
    { symbol: 'GBP/INR', name: 'GBP / INR', base: 'GBP', target: 'INR' },
    { symbol: 'JPY/INR', name: 'JPY / INR', base: 'JPY', target: 'INR' },
    { symbol: 'AUD/INR', name: 'AUD / INR', base: 'AUD', target: 'INR' },
  ];

  try {
    // Fetch USD to INR rate as base
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      {
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rates = data.rates;
      const inrRate = rates.INR || 83;

      return pairs.map(pair => {
        let price = 0;
        if (pair.base === 'USD') {
          price = inrRate;
        } else if (pair.base === 'EUR') {
          price = inrRate / (rates.EUR || 0.92);
        } else if (pair.base === 'GBP') {
          price = inrRate / (rates.GBP || 0.79);
        } else if (pair.base === 'JPY') {
          price = inrRate / (rates.JPY || 150) * 100; // Per 100 JPY
        } else if (pair.base === 'AUD') {
          price = inrRate / (rates.AUD || 1.53);
        }

        // Return null for change values - historical FX data not available from free API
        // Frontend will display "--" for unavailable change data
        return {
          symbol: pair.symbol,
          name: pair.name,
          price: Number(price.toFixed(4)),
          change: null,
          changePercent: null,
        };
      });
    }
  } catch (error) {
    console.error('Exchange rate API error:', error);
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const market = searchParams.get('market') || 'US';

    // Handle crypto market separately
    if (market.toLowerCase() === 'crypto') {
      const cryptoData = await fetchCryptoData();
      return NextResponse.json({
        indices: cryptoData,
        futures: [],
        mostActive: [],
        gainers: [],
        losers: [],
      });
    }

    // Handle currencies market separately
    if (market.toLowerCase() === 'currencies') {
      const currencyData = await fetchCurrencyData();
      return NextResponse.json({
        indices: currencyData,
        futures: [],
        mostActive: [],
        gainers: [],
        losers: [],
      });
    }

    // For stock markets (US, Europe, India, global, futures), use Python backend
    let indicesData: any[] = [];
    let futuresData: any[] = [];
    let mostActive: any[] = [];
    let gainers: any[] = [];
    let losers: any[] = [];

    try {
      const response = await fetch(
        `${PYTHON_SERVER_URL}/api/summary?market=${encodeURIComponent(market)}`,
        {
          signal: AbortSignal.timeout(15000),
          cache: 'no-store',
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (!result.error) {
          indicesData = result.indices || [];
          futuresData = result.futures || [];
          mostActive = result.mostActive || [];
          gainers = result.gainers || [];
          losers = result.losers || [];
        }
      } else {
        console.error(`Python server returned ${response.status}`);
      }
    } catch (error: any) {
      console.error('Stock summary error:', error);
    }

    return NextResponse.json({
      indices: addLogosToStocks(indicesData),
      futures: futuresData,
      mostActive: addLogosToStocks(mostActive),
      gainers: addLogosToStocks(gainers),
      losers: addLogosToStocks(losers),
    });
  } catch (error) {
    console.error('Market summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market summary' },
      { status: 500 }
    );
  }
}
