#!/usr/bin/env python3
"""
FastAPI server for stock and Wikipedia data.
Uses yfinance as PRIMARY data source (free, no API key required).
Fallback sources: NSE (Indian stocks), local stock list.
"""

from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import httpx
import json
import os
import sys
import time
import asyncio
import platform
import uuid
from datetime import datetime, timedelta
from functools import lru_cache

# Windows-specific event loop policy for better async handling
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Import yfinance for historical data fallback (per B.md)
try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    print("WARNING: yfinance not installed - no fallback for historical data")
    YFINANCE_AVAILABLE = False

# Import Gemini for sector classification
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    print("WARNING: google-generativeai not installed - Peer competitors will use basic fallback")
    GEMINI_AVAILABLE = False

# Import Wikipedia library (still needed for company descriptions)
try:
    import wikipedia
except ImportError as e:
    print(f"Missing required library: {e}")
    print("Install with: pip install wikipedia")
    sys.exit(1)

# Load environment variables
from dotenv import load_dotenv
load_dotenv(override=True)

# API keys (optional - yfinance doesn't need any)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

if not GEMINI_API_KEY:
    print("WARNING: No GEMINI_API_KEY found in environment")

print("Using yfinance as primary data source (free, no API key required)")

# ============================================================================
# CACHING LAYER - Per B.md: "Cache prices (10-30s)"
# ============================================================================
class PriceCache:
    """Simple in-memory cache with TTL for price data"""
    def __init__(self, default_ttl: int = 30):
        self._cache: Dict[str, tuple] = {}  # key -> (value, expiry_time)
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            value, expiry = self._cache[key]
            if time.time() < expiry:
                return value
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        expiry = time.time() + (ttl or self.default_ttl)
        self._cache[key] = (value, expiry)

    def clear(self):
        self._cache.clear()

# Cache instances
quote_cache = PriceCache(default_ttl=30)  # 30 seconds for real-time prices
historical_cache = PriceCache(default_ttl=300)  # 5 minutes for historical data
search_cache = PriceCache(default_ttl=300)  # 5 minutes for search results

# Rate limiter for yfinance to avoid 429 errors
class YFinanceRateLimiter:
    """Simple rate limiter with exponential backoff for yfinance"""
    def __init__(self):
        self.last_request_time = 0
        self.min_interval = 0.5  # 500ms between requests
        self.backoff_until = 0

    def wait_if_needed(self):
        import time as t
        now = t.time()

        # Check if in backoff period
        if now < self.backoff_until:
            wait_time = self.backoff_until - now
            t.sleep(wait_time)

        # Enforce minimum interval
        elapsed = now - self.last_request_time
        if elapsed < self.min_interval:
            t.sleep(self.min_interval - elapsed)

        self.last_request_time = t.time()

    def trigger_backoff(self, seconds: int = 5):
        import time as t
        self.backoff_until = t.time() + seconds

yf_rate_limiter = YFinanceRateLimiter()

# ============================================================================
# BATCH PRICE FETCHER - Efficiently fetch prices for multiple symbols at once
# ============================================================================
async def fetch_prices_for_symbols(symbols: list) -> Dict[str, dict]:
    """Batch-fetch prices by reusing fetch_yfinance_quote() in parallel."""
    if not YFINANCE_AVAILABLE or not symbols:
        return {}

    results = {}
    symbols_to_fetch = []

    # Check cache first
    for sym in symbols:
        cached = quote_cache.get(f"price_{sym}")
        if cached:
            results[sym] = cached
        else:
            symbols_to_fetch.append(sym)

    if not symbols_to_fetch:
        return results

    # Fetch in parallel using the proven fetch_yfinance_quote()
    tasks = [fetch_yfinance_quote(sym) for sym in symbols_to_fetch]
    fetched = await asyncio.gather(*tasks, return_exceptions=True)

    for sym, result in zip(symbols_to_fetch, fetched):
        if isinstance(result, Exception) or result is None:
            continue
        price_data = {
            "price": result.get("price"),
            "change": result.get("change"),
            "changePercent": result.get("changePercent"),
        }
        if price_data["price"] is not None:
            results[sym] = price_data
            quote_cache.set(f"price_{sym}", price_data, ttl=30)

    return results

# Import database module
from database import (
    init_db, get_portfolio, save_portfolio, reset_portfolio as db_reset_portfolio,
    get_holdings, upsert_holding, delete_holding, update_holding_quantity,
    get_transactions, add_transaction,
    get_alerts, add_alert, update_alert, delete_alert,
    get_watchlist, add_watchlist_item, remove_watchlist_item,
    # Mentor & Evaluation
    add_checklist, get_checklists, get_checklist_stats, get_checklists_raw,
    add_mentor_trigger, dismiss_mentor_trigger, get_mentor_triggers, get_mentor_triggers_raw,
    upsert_daily_score, get_daily_scores, get_latest_daily_score,
    upsert_badge, get_badges,
    add_monthly_report, get_latest_report, get_report_history,
    add_challenge, update_challenge, get_active_challenges, get_challenge_history,
    get_completed_challenge_count,
    # Journal
    add_journal_entry, get_journal_entries, get_journal_entries_for_symbol,
    get_journal_entries_for_transaction,
    # Behavior tracking
    get_all_daily_scores, get_trigger_counts_by_type,
    # Sentiment
    get_sentiment_history,
    save_divergence_snapshot,
)
from mentor_engine import run_all_checks, get_gemini_mentor_feedback, enrich_alerts_with_history
from scoring_engine import (
    compute_all_scores, evaluate_badges, compute_overall_grade,
    generate_report_summary, compute_trader_profile, BADGE_DEFINITIONS,
    compute_behavior_summary,
)
from challenges import CHALLENGE_TEMPLATES, compute_challenge_progress
from sentiment_engine import get_sentiment, get_sentiment_batch

app = FastAPI(title="StockMind API Server", version="3.0.0")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# YFINANCE PRIMARY - All stock data from yfinance (FREE, no API key required)
# ============================================================================

# ============================================================================
# NSE INTEGRATION - Per Prompt.md: "NSE Python library for Indian stocks"
# ============================================================================
async def fetch_nse_quote(symbol: str) -> Optional[Dict]:
    """Fetch stock quote from NSE for Indian stocks"""
    # Check cache first
    cache_key = f"nse_quote_{symbol.upper()}"
    cached = quote_cache.get(cache_key)
    if cached:
        return cached

    try:
        # Try importing nsetools - it may not be installed
        from nsetools import Nse
        nse = Nse()

        # Remove .NS suffix if present
        clean_symbol = symbol.upper().replace(".NS", "").replace(".BO", "")

        # Fetch quote synchronously (nsetools is not async)
        quote = nse.get_quote(clean_symbol)

        if not quote:
            return None

        result = {
            "symbol": clean_symbol + ".NS",
            "name": quote.get("companyName", clean_symbol),
            "price": float(quote.get("lastPrice", 0)),
            "change": float(quote.get("change", 0)),
            "changePercent": float(quote.get("pChange", 0)),
            "previousClose": float(quote.get("previousClose", 0)),
            "dayHigh": float(quote.get("dayHigh", 0)),
            "dayLow": float(quote.get("dayLow", 0)),
            "yearHigh": float(quote.get("high52", 0)),
            "yearLow": float(quote.get("low52", 0)),
            "volume": int(quote.get("quantityTraded", 0)),
            "exchange": "NSE",
            "currency": "INR",
            "source": "nse"
        }

        # Enrich with yfinance metadata (marketCap, P/E, dividend, etc.)
        try:
            import yfinance as yf
            yf_symbol = clean_symbol + ".NS"
            ticker = yf.Ticker(yf_symbol)
            info = ticker.info or {}

            def _safe_float(val, default=0.0):
                try:
                    return float(val) if val is not None else default
                except:
                    return default

            def _safe_int(val, default=0):
                try:
                    return int(val) if val is not None else default
                except:
                    return default

            result["marketCap"] = _safe_int(info.get("marketCap") or info.get("totalAssets"))
            result["pe"] = _safe_float(info.get("trailingPE") or info.get("forwardPE"))
            result["eps"] = _safe_float(info.get("trailingEps"))
            result["dividend"] = _safe_float(info.get("dividendRate"))
            raw_dy = _safe_float(info.get("dividendYield", 0))
            result["dividendYield"] = raw_dy * 100 if raw_dy < 0.20 else raw_dy
            result["avgVolume"] = _safe_int(info.get("averageDailyVolume10Day") or info.get("averageVolume"))
            result["description"] = info.get("longBusinessSummary", "")
            # Use yfinance 52-week range if NSE values are 0
            if result["yearHigh"] == 0:
                result["yearHigh"] = _safe_float(info.get("fiftyTwoWeekHigh"))
            if result["yearLow"] == 0:
                result["yearLow"] = _safe_float(info.get("fiftyTwoWeekLow"))
            if result["dayHigh"] == 0:
                result["dayHigh"] = _safe_float(info.get("dayHigh") or info.get("regularMarketDayHigh"))
            if result["dayLow"] == 0:
                result["dayLow"] = _safe_float(info.get("dayLow") or info.get("regularMarketDayLow"))
            print(f"NSE quote enriched with yfinance metadata for {yf_symbol}")
            sys.stdout.flush()
        except Exception as e:
            print(f"yfinance enrichment failed for {clean_symbol}.NS (non-critical): {e}")
            sys.stdout.flush()

        # Cache for 30 seconds
        quote_cache.set(cache_key, result, ttl=30)
        return result

    except ImportError:
        print("NSE library not installed. Install with: pip install nsetools")
        return None
    except Exception as e:
        print(f"NSE error for {symbol}: {e}")
        return None

def is_indian_stock(symbol: str) -> bool:
    """Check if a symbol is an Indian stock"""
    return symbol.upper().endswith((".NS", ".BO"))

def is_us_stock(symbol: str, exchange: str = "") -> bool:
    """Check if a symbol is a US stock"""
    us_exchanges = ["NYSE", "NASDAQ", "AMEX", "NYSEARCA", "BATS"]
    if exchange and any(exc in exchange.upper() for exc in us_exchanges):
        return True
    # Simple heuristic: if no dot in symbol and not a known index, likely US
    if "." not in symbol and not symbol.startswith("^"):
        return True
    return False

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "message": "StockMind Python API Server (yfinance)",
        "version": "3.0.0"
    }

@app.get("/health")
async def health_check():
    """Explicit health check endpoint for monitoring"""
    return {
        "status": "ok",
        "server": "python-stock-api",
        "api": "yfinance (free, unlimited)"
    }

@app.get("/api/quote")
async def get_quote(symbol: str = Query(..., description="Stock symbol")):
    """
    Get real-time stock quote using yfinance as PRIMARY source (free, no API key).
    - Indian stocks (.NS, .BO) -> NSE library first, then yfinance fallback
    - All others -> yfinance (PRIMARY)
    """
    symbol_upper = symbol.upper()

    # Check quote cache first (unified across sources)
    cache_key = f"unified_quote_{symbol_upper}"
    cached = quote_cache.get(cache_key)
    if cached:
        return cached

    # Strategy 1: Indian stocks -> Try NSE first
    if is_indian_stock(symbol_upper):
        result = await fetch_nse_quote(symbol_upper)
        if result:
            quote_cache.set(cache_key, result, ttl=30)
            return result
        # Fallback to yfinance for Indian stocks

    # Strategy 2: yfinance (PRIMARY for all stocks)
    result = await fetch_yfinance_quote(symbol_upper)
    if result:
        quote_cache.set(cache_key, result, ttl=30)
        return result

    return {"error": f"Stock data for '{symbol}' is temporarily unavailable"}


async def fetch_yfinance_quote(symbol: str) -> Optional[Dict]:
    """
    PRIMARY: Fetch real-time quote from yfinance library.
    Uses history() for reliable price data + info for metadata.
    Includes rate limiting and retry logic.
    """
    if not YFINANCE_AVAILABLE:
        print("yfinance not available")
        return None

    try:
        loop = asyncio.get_event_loop()

        def _get_yf_data():
            # Apply rate limiting
            yf_rate_limiter.wait_if_needed()

            ticker = yf.Ticker(symbol)

            # Try to get history first (more reliable)
            hist = None
            for period in ["5d", "1mo", "3mo"]:
                try:
                    hist = ticker.history(period=period)
                    if not hist.empty:
                        break
                except Exception as e:
                    if "429" in str(e) or "Too Many Requests" in str(e):
                        yf_rate_limiter.trigger_backoff(10)
                        print(f"yfinance rate limited, backing off...")
                    continue

            # Get info separately with error handling
            info = {}
            try:
                info = ticker.info or {}
            except Exception as e:
                if "429" in str(e):
                    yf_rate_limiter.trigger_backoff(10)
                print(f"yfinance info failed for {symbol}: {e}")

            return hist, info

        hist, info = await asyncio.wait_for(
            loop.run_in_executor(None, _get_yf_data), timeout=8
        )

        if hist.empty:
            print(f"yfinance: No data for {symbol}")
            return None

        # Get latest price and previous close from history (more reliable)
        latest = hist.iloc[-1]
        prev_close = hist.iloc[-2]['Close'] if len(hist) > 1 else latest['Open']
        current_price = latest['Close']

        change = current_price - prev_close
        change_percent = (change / prev_close * 100) if prev_close != 0 else 0

        # Safely extract metadata
        name = info.get("longName") or info.get("shortName") or symbol.upper()

        # Handle None values safely
        def safe_float(val, default=0):
            try:
                return float(val) if val is not None else default
            except:
                return default

        def safe_int(val, default=0):
            try:
                return int(val) if val is not None else default
            except:
                return default

        result = {
            "symbol": symbol.upper(),
            "name": name,
            "price": float(current_price),
            "change": float(change),
            "changePercent": float(change_percent),
            "previousClose": float(prev_close),
            "dayHigh": float(latest['High']),
            "dayLow": float(latest['Low']),
            "volume": int(latest['Volume']),
            "avgVolume": safe_int(info.get("averageDailyVolume10Day") or info.get("averageVolume")),
            "marketCap": safe_int(info.get("marketCap") or info.get("totalAssets")),
            "pe": safe_float(info.get("trailingPE") or info.get("forwardPE")),
            "eps": safe_float(info.get("trailingEps")),
            "dividend": safe_float(info.get("dividendRate")),
            "dividendYield": (lambda dy: dy * 100 if dy < 0.20 else dy)(safe_float(info.get("dividendYield", 0))),
            "yearLow": safe_float(info.get("fiftyTwoWeekLow")),
            "yearHigh": safe_float(info.get("fiftyTwoWeekHigh")),
            "exchange": info.get("exchange", "Market"),
            "currency": info.get("currency", "USD"),
            "description": info.get("longBusinessSummary", ""),
            "source": "yfinance"
        }

        print(f"yfinance quote success for {symbol}: ${current_price:.2f}")
        sys.stdout.flush()
        return result
    except Exception as e:
        print(f"yfinance quote error for {symbol}: {e}")
        sys.stdout.flush()
        return None




# ============================================================================
# YFINANCE HISTORICAL - Primary source for chart data (FREE)
# ============================================================================
async def fetch_yfinance_historical(symbol: str, time_range: str) -> Dict:
    """
    PRIMARY: Fetch historical data using yfinance.
    Returns OHLC data for TradingView charts.
    """
    if not YFINANCE_AVAILABLE:
        return {"error": "yfinance not available", "data": []}

    try:
        loop = asyncio.get_event_loop()

        # Map time ranges to yfinance parameters
        range_map = {
            '1D': {'period': '1d', 'interval': '5m'},
            '5D': {'period': '5d', 'interval': '15m'},
            '1M': {'period': '1mo', 'interval': '1d'},
            '6M': {'period': '6mo', 'interval': '1d'},
            '1Y': {'period': '1y', 'interval': '1d'},
            'MAX': {'period': '5y', 'interval': '1wk'},
        }

        params = range_map.get(time_range, range_map['1M'])

        def _get_history():
            ticker = yf.Ticker(symbol)
            return ticker.history(period=params['period'], interval=params['interval'])

        hist = await loop.run_in_executor(None, _get_history)

        if hist.empty:
            print(f"yfinance: No historical data for {symbol}")
            return {"error": f"No historical data for {symbol}", "data": []}

        chart_data = []
        for ts, row in hist.iterrows():
            chart_data.append({
                'time': int(ts.timestamp()),
                'value': float(row['Close']),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
            })

        print(f"yfinance historical for {symbol}: {len(chart_data)} data points")
        sys.stdout.flush()
        return {"data": chart_data, "source": "yfinance"}

    except Exception as e:
        print(f"yfinance historical error for {symbol}: {e}")
        sys.stdout.flush()
        return {"error": str(e), "data": []}


@app.get("/api/historical")
async def get_historical(
    symbol: str = Query(..., description="Stock symbol"),
    range: str = Query("1M", description="Time range: 1D, 5D, 1M, 6M, 1Y, MAX")
):
    """Get historical price data for charts using yfinance (FREE)"""
    # Check cache first
    cache_key = f"historical_{symbol.upper()}_{range}"
    cached = historical_cache.get(cache_key)
    if cached:
        return cached

    # Use yfinance as primary source
    result = await fetch_yfinance_historical(symbol.upper(), range)

    if result and result.get("data"):
        historical_cache.set(cache_key, result, ttl=300)

    return result

@app.get("/api/search")
async def search_stocks(query: str = Query(..., description="Search query")):
    """
    Search for stocks using yfinance validation + local stock list.
    yfinance doesn't have a native search API, so we:
    1. Check if query is a valid ticker symbol
    2. Search local list for partial matches
    """
    # Check cache first
    cache_key = f"search_{query.lower()}"
    cached = search_cache.get(cache_key)
    if cached:
        return cached

    results = []

    # Strategy 1: Try to validate the query as a ticker symbol
    if YFINANCE_AVAILABLE:
        try:
            loop = asyncio.get_event_loop()

            def _validate_ticker():
                ticker = yf.Ticker(query.upper())
                hist = ticker.history(period="5d")
                if not hist.empty:
                    # Compute change from last two closing prices (reliable)
                    current_price = float(hist['Close'].iloc[-1])
                    prev_close = float(hist['Close'].iloc[-2]) if len(hist) > 1 else current_price
                    change = current_price - prev_close
                    change_pct = (change / prev_close * 100) if prev_close != 0 else 0

                    try:
                        info = ticker.info
                        return {
                            "symbol": query.upper(),
                            "name": info.get("longName") or info.get("shortName") or query.upper(),
                            "exchange": info.get("exchange", ""),
                            "country": "USA" if info.get("currency") == "USD" else "",
                            "price": current_price,
                            "change": round(change, 2),
                            "changePercent": round(change_pct, 2),
                            "currency": info.get("currency", "USD"),
                        }
                    except:
                        return {
                            "symbol": query.upper(),
                            "name": query.upper(),
                            "exchange": "",
                            "country": "",
                            "price": current_price,
                            "change": round(change, 2),
                            "changePercent": round(change_pct, 2),
                            "currency": "USD",
                        }
                return None

            validated = await asyncio.wait_for(
                loop.run_in_executor(None, _validate_ticker), timeout=5
            )
            if validated:
                results.append(validated)
                # Cache validated ticker price data for reuse
                quote_cache.set(f"price_{validated['symbol']}", {
                    "price": validated["price"],
                    "change": validated["change"],
                    "changePercent": validated["changePercent"],
                }, ttl=30)
                print(f"yfinance validated ticker: {query.upper()}")

        except Exception as e:
            print(f"yfinance ticker validation failed for {query}: {e}")

    # Strategy 2: Search local list for partial matches
    local_results = search_local_fallback(query)
    for stock in local_results:
        # Avoid duplicates
        if not any(r['symbol'] == stock['symbol'] for r in results):
            results.append(stock)

    # Limit to 10 results
    results = results[:10]

    # Hydrate results that are missing prices (from local fallback)
    symbols_needing_prices = [
        r['symbol'] for r in results
        if r.get('needsPriceFetch') or r.get('price') is None
    ]
    if symbols_needing_prices:
        try:
            price_data = await asyncio.wait_for(
                fetch_prices_for_symbols(symbols_needing_prices), timeout=5
            )
            for r in results:
                if r['symbol'] in price_data:
                    pd = price_data[r['symbol']]
                    r['price'] = pd['price']
                    r['change'] = pd['change']
                    r['changePercent'] = pd['changePercent']
                r.pop('needsPriceFetch', None)
        except Exception as e:
            print(f"Price hydration failed: {e}")
            # Clean up the flag even on failure
            for r in results:
                r.pop('needsPriceFetch', None)

    if results:
        search_cache.set(cache_key, results, ttl=300)
        print(f"Search for '{query}': {len(results)} results")

    return results

# ============================================================================
# SEARCH FALLBACK - Common popular stocks for offline/rate-limit scenarios
# ============================================================================
COMMON_STOCKS = [
    # US Tech Giants
    {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "type": "Equity", "currency": "USD"},
    {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "type": "Equity", "currency": "USD"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "exchange": "NASDAQ", "type": "Equity", "currency": "USD"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "exchange": "NASDAQ", "type": "Equity", "currency": "USD"},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "type": "Equity", "currency": "USD"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "exchange": "NASDAQ", "type": "Equity", "currency": "USD"},
    {"symbol": "META", "name": "Meta Platforms Inc.", "exchange": "NASDAQ", "type": "Equity", "currency": "USD"},
    {"symbol": "NFLX", "name": "Netflix Inc.", "exchange": "NASDAQ", "type": "Equity", "currency": "USD"},
    {"symbol": "AMD", "name": "Advanced Micro Devices", "exchange": "NASDAQ", "type": "Equity", "currency": "USD"},
    {"symbol": "INTC", "name": "Intel Corporation", "exchange": "NASDAQ", "type": "Equity", "currency": "USD"},
    
    # US Finance & Retail
    {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "exchange": "NYSE", "type": "Equity", "currency": "USD"},
    {"symbol": "V", "name": "Visa Inc.", "exchange": "NYSE", "type": "Equity", "currency": "USD"},
    {"symbol": "WMT", "name": "Walmart Inc.", "exchange": "NYSE", "type": "Equity", "currency": "USD"},
    {"symbol": "PG", "name": "Procter & Gamble", "exchange": "NYSE", "type": "Equity", "currency": "USD"},
    {"symbol": "KO", "name": "Coca-Cola Company", "exchange": "NYSE", "type": "Equity", "currency": "USD"},

    # Indian Majors
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "exchange": "NSE", "type": "Equity", "currency": "INR"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE", "type": "Equity", "currency": "INR"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "exchange": "NSE", "type": "Equity", "currency": "INR"},
    {"symbol": "INFY.NS", "name": "Infosys Limited", "exchange": "NSE", "type": "Equity", "currency": "INR"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "exchange": "NSE", "type": "Equity", "currency": "INR"},
]

# Market-specific stocks for movers calculation
# These are popular stocks that get fetched to calculate gainers/losers/mostActive
MARKET_MOVERS_STOCKS = {
    'US': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX', 'AMD', 'INTC',
           'JPM', 'V', 'WMT', 'DIS', 'CRM', 'PYPL', 'UBER', 'BA', 'GE', 'KO'],
    'India': ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
              'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS', 'LT.NS', 'AXISBANK.NS',
              'SBIN.NS', 'MARUTI.NS', 'TATAMOTORS.NS', 'SUNPHARMA.NS', 'WIPRO.NS'],
    'Europe': ['SAP', 'ASML', 'NVO', 'SHEL', 'TTE', 'LVMHF', 'AZN', 'HSBC', 'BTI', 'UL'],
    'global': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS'],
}

def search_local_fallback(query: str) -> list:
    """Local search fallback when API fails"""
    query = query.lower()
    results = []

    for stock in COMMON_STOCKS:
        if query in stock['symbol'].lower() or query in stock['name'].lower():
            results.append({
                "symbol": stock['symbol'],
                "name": stock['name'],
                "exchange": stock['exchange'],
                "country": "USA" if stock['currency'] == "USD" else "India",
                "price": None,  # Return None instead of 0.0 - frontend handles gracefully
                "change": None,
                "changePercent": None,
                "currency": stock['currency'],
                "needsPriceFetch": True  # Flag to indicate price needs fetching
            })

    print(f"Local fallback found {len(results)} results for '{query}'")
    return results


@app.get("/api/summary")
async def get_summary(market: str = Query("US", description="Market: US, India, Europe, global")):
    """Get market summary indices using yfinance (FREE)"""
    # Check cache first
    cache_key = f"summary_{market}"
    cached = quote_cache.get(cache_key)
    if cached:
        return cached

    try:
        # Market index mapping
        market_map = {
            'US': ['^DJI', '^GSPC', '^IXIC', '^RUT', '^VIX'],
            'India': ['^NSEI', '^BSESN', '^NSEBANK'],
            'Europe': ['^GDAXI', '^FTSE', '^FCHI', '^IBEX', '^STOXX50E'],
            'global': ['^GSPC', '^DJI', '^NSEI', '^FTSE'],
            'futures': ['YM=F', 'ES=F', 'NQ=F', 'GC=F', 'CL=F'],
            'currencies': [],
            'crypto': [],
        }

        # Futures symbols per market
        market_futures = {
            'US': [],
            'India': [],
            'Europe': [],
            'global': ['GC=F', 'CL=F'],
            'futures': [],
            'currencies': [],
            'crypto': [],
        }

        futures_symbols = market_futures.get(market, [])
        indices_symbols = market_map.get(market, market_map['US'])
        indices = []
        futures = []

        # Index name mapping
        name_map = {
            '^GSPC': 'S&P 500', '^DJI': 'Dow Jones', '^IXIC': 'Nasdaq',
            '^RUT': 'Russell', '^VIX': 'VIX',
            '^NSEI': 'NIFTY 50', '^BSESN': 'SENSEX', '^NSEBANK': 'Nifty Bank',
            '^FTSE': 'FTSE 100', '^GDAXI': 'DAX', '^FCHI': 'CAC 40',
            '^IBEX': 'IBEX 35', '^STOXX50E': 'STOXX 50',
            'GC=F': 'Gold', 'CL=F': 'Crude Oil', 'ES=F': 'S&P Futures',
            'NQ=F': 'Nasdaq Futures', 'YM=F': 'Dow Futures',
        }

        # Fetch index quotes using get_quote (which uses yfinance)
        async def fetch_index_quote(symbol: str, quote_type: str):
            try:
                quote_result = await get_quote(symbol)
                if quote_result and not quote_result.get("error"):
                    return {
                        "type": quote_type,
                        "symbol": symbol,
                        "name": name_map.get(symbol, quote_result.get("name") or symbol),
                        "price": float(quote_result.get("price", 0)),
                        "change": float(quote_result.get("change", 0)),
                        "changePercent": float(quote_result.get("changePercent", 0)),
                    }
            except Exception as e:
                print(f"Failed to fetch {symbol}: {e}")
            return None

        # Fetch all indices and futures in parallel
        tasks = []
        for symbol in indices_symbols:
            tasks.append(fetch_index_quote(symbol, "index"))
        for symbol in futures_symbols:
            tasks.append(fetch_index_quote(symbol, "future"))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        num_indices = len(indices_symbols)
        for result in results[:num_indices]:
            if result and not isinstance(result, Exception) and result.get("type") == "index":
                del result["type"]
                indices.append(result)

        for result in results[num_indices:]:
            if result and not isinstance(result, Exception) and result.get("type") == "future":
                del result["type"]
                futures.append(result)

        # Calculate movers from predefined stocks
        movers_symbols = MARKET_MOVERS_STOCKS.get(market, MARKET_MOVERS_STOCKS.get('US', []))
        movers_data = []

        if movers_symbols:
            async def fetch_mover_quote(symbol: str):
                try:
                    quote_result = await get_quote(symbol)
                    if quote_result and not quote_result.get("error") and quote_result.get("price"):
                        return {
                            "symbol": symbol,
                            "name": quote_result.get("name", symbol),
                            "price": float(quote_result.get("price", 0)),
                            "change": float(quote_result.get("change", 0)),
                            "changePercent": float(quote_result.get("changePercent", 0)),
                            "volume": int(quote_result.get("volume", 0)),
                        }
                except Exception as e:
                    print(f"Failed to fetch mover {symbol}: {e}")
                return None

            # Fetch all mover quotes in parallel
            mover_tasks = [fetch_mover_quote(sym) for sym in movers_symbols]
            mover_results = await asyncio.gather(*mover_tasks, return_exceptions=True)

            for mover in mover_results:
                if mover and not isinstance(mover, Exception):
                    movers_data.append(mover)

        # Sort for gainers (highest changePercent)
        gainers = sorted(
            [m for m in movers_data if m.get('changePercent', 0) > 0],
            key=lambda x: x.get('changePercent', 0),
            reverse=True
        )[:5]

        # Sort for losers (lowest changePercent)
        losers = sorted(
            [m for m in movers_data if m.get('changePercent', 0) < 0],
            key=lambda x: x.get('changePercent', 0)
        )[:5]

        # Sort for most active (highest volume)
        most_active = sorted(
            movers_data,
            key=lambda x: x.get('volume', 0),
            reverse=True
        )[:5]

        result = {
            "indices": indices,
            "futures": futures,
            "mostActive": most_active,
            "gainers": gainers,
            "losers": losers,
        }

        # Cache for 60 seconds
        quote_cache.set(cache_key, result, ttl=60)
        return result

    except Exception as e:
        return {"error": f"Failed to fetch summary: {str(e)}"}

@app.get("/api/wikipedia")
async def get_wikipedia(query: str = Query(..., description="Wikipedia search query")):
    """Get Wikipedia page summary and content"""
    try:
        # Search for the page
        search_results = wikipedia.search(query, results=1)

        if not search_results:
            return {"error": "No results found", "summary": "", "fullText": ""}

        # Get the page
        page = wikipedia.page(search_results[0], auto_suggest=False)

        result = {
            "summary": page.summary,
            "fullText": page.content,
            "url": page.url,
            "title": page.title
        }

        return result

    except wikipedia.exceptions.DisambiguationError as e:
        # If multiple pages match, use the first option
        try:
            page = wikipedia.page(e.options[0], auto_suggest=False)
            result = {
                "summary": page.summary,
                "fullText": page.content,
                "url": page.url,
                "title": page.title
            }
            return result
        except Exception as err:
            return {"error": str(err), "summary": "", "fullText": ""}

    except wikipedia.exceptions.PageError:
        return {"error": "Page not found", "summary": "", "fullText": ""}

    except Exception as e:
        return {"error": str(e), "summary": "", "fullText": ""}

async def fetch_gemini_classification(symbol: str, description: str) -> Dict:
    """Use Gemini to classify company into sectors and suggest competitors"""
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        return {"sectors": [], "top_3_overall": []}

    try:
        model = genai.GenerativeModel('gemini-2.0-flash-lite')
        prompt = f"""
        Given the following company description for {symbol}, identify 3 to 5 DISTINCT business sectors
        it operates in and suggest 3 direct competitors for each sector.
        IMPORTANT: Use real stock symbols (tickers) for competitors if known (especially for US/India tech).

        EXAMPLE: Amazon operates in E-commerce, Cloud Computing (AWS), Digital Streaming, Logistics, and AI/Machine Learning.
        EXAMPLE: Reliance Industries operates in Oil & Gas Refining, Telecommunications (Jio), Retail, Digital Services, and Petrochemicals.
        EXAMPLE: TCS operates in IT Services, Business Process Outsourcing, Cloud & Infrastructure, and Digital Transformation Consulting.

        For Indian conglomerates and large diversified companies, identify ALL distinct business verticals (aim for 4-5 sectors).
        For Indian companies, competitors should primarily be other Indian listed companies with .NS suffixes where applicable.

        Format the output as a JSON object with this exact structure:
        {{
            "sectors": [
                {{
                    "name": "Sector Name",
                    "competitors": [
                        {{"name": "Competitor Name", "symbol": "TICKER"}}
                    ]
                }}
            ],
            "top_3_overall": [
                {{"name": "Top Competitor Name", "symbol": "TICKER"}}
            ]
        }}
        Return ONLY the JSON. No preamble, no markdown blocks.

        Description: {description[:2500]}
        """

        response = await asyncio.get_event_loop().run_in_executor(
            None, 
            lambda: model.generate_content(prompt)
        )
        
        import json
        text = response.text.strip()
        # Handle cases where LLM might still wrap in markdown
        if "```" in text:
            import re
            match = re.search(r'(\{.*\})', text.replace('\n', ' '), re.DOTALL)
            if match:
                text = match.group(1)
        
        return json.loads(text.strip())
    except Exception as e:
        print(f"Gemini error for {symbol}: {e}")
        return {"sectors": [], "top_3_overall": []}

async def get_wikipedia_summary(symbol: str) -> Dict:
    """Get company description from Wikipedia with resilient fallback to name search"""
    try:
        symbol_clean = symbol.upper()
        # Clean up common suffixes for Wiki search
        search_term = symbol_clean
        if ".NS" in search_term: search_term = search_term.replace(".NS", "")
        if ".BO" in search_term: search_term = search_term.replace(".BO", "")
        
        loop = asyncio.get_event_loop()
        
        # 1. Try exact symbol search first
        try:
            page = await loop.run_in_executor(None, lambda: wikipedia.page(search_term, auto_suggest=False))
        except:
            # 2. If symbol fails, search for company name if we can get it
            name_to_search = search_term
            try:
                ticker = yf.Ticker(symbol_clean)
                info = ticker.info
                name_to_search = info.get("longName") or info.get("shortName") or search_term
                # Remove common legal suffixes for better wiki matching
                name_to_search = name_to_search.split(" Inc.")[0].split(" Ltd.")[0].split(" Corp.")[0]
            except:
                pass
            
            try:
                search_results = await loop.run_in_executor(None, lambda: wikipedia.search(name_to_search))
                if search_results:
                    page = await loop.run_in_executor(None, lambda: wikipedia.page(search_results[0], auto_suggest=False))
                else:
                    return {"error": "Page not found", "summary": "", "fullText": ""}
            except:
                return {"error": "Page not found", "summary": "", "fullText": ""}

        return {
            "summary": page.summary,
            "fullText": page.content,
            "url": page.url,
            "title": page.title
        }
    except Exception as e:
        return {"error": str(e), "summary": "", "fullText": ""}

@app.get("/api/wikipedia")
async def get_wikipedia(query: str = Query(..., description="Wikipedia search query")):
    """Get Wikipedia page summary and content"""
    return await get_wikipedia_summary(query)

@app.get("/api/competitors")
async def get_competitors(symbol: str = Query(..., description="Stock symbol")):
    """Get peer competitors using Wikipedia + Gemini"""
    symbol_upper = symbol.upper()
    cache_key = f"competitors_{symbol_upper}"
    cached = search_cache.get(cache_key)
    if cached:
        return cached

    try:
        # 1. Get company description from Wikipedia
        wiki_data = await get_wikipedia_summary(symbol_upper)
        description = wiki_data.get("summary") or wiki_data.get("fullText", "")
        
        # If Wikipedia fails specifically for this ticker, try symbol name
        if not description:
            try:
                ticker = yf.Ticker(symbol_upper)
                description = ticker.info.get("longBusinessSummary", "")
            except:
                pass

        if not description:
            return {"peerCompetitors": [], "topCompetitors": []}

        # 2. Get classification from Gemini
        classification = await fetch_gemini_classification(symbol_upper, description)
        
        # 3. Resolve top 3 competitors to get prices (Parallelize for speed)
        top_suggested = classification.get("top_3_overall", [])
        top_competitors = []
        
        async def resolve_comp(comp):
            ticker = comp.get("symbol")
            if ticker:
                quote = await get_quote(ticker)
                if not quote.get("error"):
                    return {
                        "symbol": ticker,
                        "name": quote.get("name", comp.get("name")),
                        "price": quote.get("price", 0),
                        "change": quote.get("change", 0),
                        "changePercent": quote.get("changePercent", 0),
                        "marketCap": quote.get("marketCap", 0),
                        "logo": quote.get("logo", "")
                    }
            return None

        # Gather resolves
        tasks = [resolve_comp(c) for c in top_suggested]
        resolved_results = await asyncio.gather(*tasks)
        top_competitors = [r for r in resolved_results if r]
        
        # Normalize peerCompetitors format for UI (ensure sectorName vs name)
        peer_comps = []
        for sector in classification.get("sectors", []):
            peer_comps.append({
                "sectorName": sector.get("name", "Other"),
                "competitors": sector.get("competitors", [])
            })
        
        result = {
            "peerCompetitors": peer_comps,
            "topCompetitors": top_competitors[:3]
        }
        
        search_cache.set(cache_key, result, ttl=3600)
        return result

    except Exception as e:
        print(f"Competitor API error: {e}")
        return {"error": str(e), "peerCompetitors": [], "topCompetitors": []}


# ============================================================================
# DATABASE STARTUP
# ============================================================================
async def _daily_score_scheduler():
    """Background task: compute daily scores once per day at ~00:05 UTC."""
    # Wait for DB initialization
    await asyncio.sleep(10)
    print("Daily evaluation scheduler started.")

    while True:
        try:
            await _compute_daily_scores_internal()
            print(f"Daily scores computed at {datetime.utcnow().isoformat()}")
        except Exception as e:
            print(f"Daily score scheduler error: {e}")

        # Sleep until next day 00:05 UTC
        now = datetime.utcnow()
        tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=5, second=0, microsecond=0)
        sleep_seconds = (tomorrow - now).total_seconds()
        await asyncio.sleep(sleep_seconds)


@app.on_event("startup")
async def startup_event():
    """Initialize SQLite database on server start."""
    await init_db()
    print("SQLite database initialized and ready.")
    # Clear stale sentiment cache on startup so new fallback logic takes effect
    from database import clear_sentiment_cache
    await clear_sentiment_cache()
    print("Stale sentiment cache cleared — fresh fetches will use Google News RSS fallback.")
    asyncio.create_task(_daily_score_scheduler())


# ============================================================================
# PYDANTIC MODELS FOR DB ENDPOINTS
# ============================================================================
class TradeRequest(BaseModel):
    symbol: str
    name: str
    type: str  # 'stock' | 'crypto'
    action: str  # 'buy' | 'sell'
    quantity: float
    price: float

class AlertRequest(BaseModel):
    symbol: str
    name: str
    type: str  # 'stock' | 'crypto'
    targetPrice: float
    condition: str  # 'above' | 'below'

class AlertUpdateRequest(BaseModel):
    active: Optional[bool] = None
    triggered: Optional[bool] = None
    targetPrice: Optional[float] = None
    condition: Optional[str] = None

class WatchlistRequest(BaseModel):
    symbol: str
    name: str
    type: str  # 'stock' | 'crypto' | 'index' | 'future'

class JournalEntryRequest(BaseModel):
    transaction_id: Optional[str] = None
    symbol: str
    mood: str  # 'confident' | 'anxious' | 'neutral' | 'frustrated' | 'excited'
    note: str


# ============================================================================
# DB API ENDPOINTS - Persistent data storage
# ============================================================================

@app.get("/api/db/portfolio")
async def db_get_portfolio():
    """Get full portfolio: balance, holdings, and transactions."""
    portfolio = await get_portfolio()
    holdings = await get_holdings()
    transactions = await get_transactions()
    return {
        "portfolio": {
            **portfolio,
            "holdings": holdings,
            "transactions": transactions,
        }
    }


@app.post("/api/db/portfolio/trade")
async def db_execute_trade(trade: TradeRequest):
    """Execute a buy/sell trade atomically: update balance, holdings, and add transaction."""
    total = trade.quantity * trade.price

    if trade.quantity <= 0:
        raise HTTPException(status_code=400, detail="Invalid quantity")

    portfolio = await get_portfolio()
    holdings = await get_holdings()

    if trade.action == "buy":
        if total > portfolio["balance"]:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        new_balance = portfolio["balance"] - total

        # Check if holding exists
        existing = next((h for h in holdings if h["symbol"] == trade.symbol and h["type"] == trade.type), None)

        if existing:
            new_qty = existing["quantity"] + trade.quantity
            new_avg = (existing["quantity"] * existing["averagePrice"] + trade.quantity * trade.price) / new_qty
            await upsert_holding(trade.symbol, trade.type, trade.name, new_qty, new_avg)
        else:
            await upsert_holding(trade.symbol, trade.type, trade.name, trade.quantity, trade.price)

        await save_portfolio(new_balance)

    elif trade.action == "sell":
        existing = next((h for h in holdings if h["symbol"] == trade.symbol and h["type"] == trade.type), None)

        if not existing:
            raise HTTPException(status_code=400, detail="You do not own this asset")
        if existing["quantity"] < trade.quantity:
            raise HTTPException(status_code=400, detail="Insufficient holdings")

        new_balance = portfolio["balance"] + total

        if existing["quantity"] == trade.quantity:
            await delete_holding(trade.symbol, trade.type)
        else:
            new_qty = existing["quantity"] - trade.quantity
            await update_holding_quantity(trade.symbol, trade.type, new_qty, existing["averagePrice"])

        await save_portfolio(new_balance)
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'buy' or 'sell'.")

    # Record transaction
    tx_id = f"{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"
    timestamp = datetime.utcnow().isoformat()
    await add_transaction(tx_id, trade.symbol, trade.name, trade.type, trade.action,
                          trade.quantity, trade.price, total, timestamp)

    return {"success": True, "message": f"Successfully {'bought' if trade.action == 'buy' else 'sold'} {trade.quantity} {trade.symbol}"}


@app.post("/api/db/portfolio/reset")
async def db_reset_portfolio_endpoint():
    """Reset portfolio to defaults."""
    await db_reset_portfolio()
    return {"success": True, "message": "Portfolio reset to defaults"}


@app.get("/api/db/alerts")
async def db_get_alerts():
    """Get all alerts."""
    alerts = await get_alerts()
    return {"alerts": alerts}


@app.post("/api/db/alerts")
async def db_create_alert(alert: AlertRequest):
    """Create a new alert."""
    alert_id = f"{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"
    created_at = datetime.utcnow().isoformat()
    await add_alert(alert_id, alert.symbol, alert.name, alert.type,
                    alert.targetPrice, alert.condition, created_at)
    return {"success": True, "id": alert_id}


@app.put("/api/db/alerts/{alert_id}")
async def db_update_alert(alert_id: str, updates: AlertUpdateRequest):
    """Update an alert (toggle active, mark triggered, etc.)."""
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    await update_alert(alert_id, update_dict)
    return {"success": True}


@app.delete("/api/db/alerts/{alert_id}")
async def db_delete_alert(alert_id: str):
    """Delete an alert."""
    await delete_alert(alert_id)
    return {"success": True}


@app.get("/api/db/watchlist")
async def db_get_watchlist():
    """Get all watchlist items."""
    items = await get_watchlist()
    return {"watchlist": items}


@app.post("/api/db/watchlist")
async def db_add_watchlist(item: WatchlistRequest):
    """Add item to watchlist."""
    added_at = datetime.utcnow().isoformat()
    await add_watchlist_item(item.symbol, item.name, item.type, added_at)
    return {"success": True}


@app.delete("/api/db/watchlist/{symbol:path}")
async def db_remove_watchlist(symbol: str):
    """Remove item from watchlist."""
    await remove_watchlist_item(symbol)
    return {"success": True}


# ============================================================================
# TRADE CHECKLISTS
# ============================================================================

class ChecklistRequest(BaseModel):
    transactionId: str
    symbol: str
    type: str
    action: str
    items: Dict[str, bool]
    skipped: bool
    completedCount: int


@app.post("/api/db/checklists")
async def db_create_checklist(req: ChecklistRequest):
    """Save a trade checklist entry."""
    checklist_id = f"cl-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"
    created_at = datetime.utcnow().isoformat()
    await add_checklist(
        checklist_id, req.transactionId, req.symbol, req.type, req.action,
        req.items.get("company_understood", False),
        req.items.get("chart_reviewed", False),
        req.items.get("position_size", False),
        req.items.get("exit_plan", False),
        req.items.get("risk_acceptable", False),
        req.skipped, req.completedCount, created_at,
    )
    return {"success": True, "id": checklist_id}


@app.get("/api/db/checklists")
async def db_get_checklists(limit: int = Query(50), offset: int = Query(0)):
    """Get checklist history."""
    checklists = await get_checklists(limit, offset)
    return {"checklists": checklists}


@app.get("/api/db/checklists/stats")
async def db_get_checklist_stats(days: int = Query(30)):
    """Get aggregated checklist stats."""
    stats = await get_checklist_stats(days)
    return {"stats": stats}


# ============================================================================
# MENTOR
# ============================================================================

@app.get("/api/mentor/analyze")
async def mentor_analyze():
    """Run all mentor pattern checks on current portfolio state."""
    transactions = await get_transactions()
    holdings = await get_holdings()
    portfolio = await get_portfolio()
    balance = portfolio.get("balance", 0)

    alerts = await run_all_checks(transactions, holdings, balance)

    # Enrich alerts with escalation history
    trigger_history = await get_mentor_triggers_raw(30)
    enriched_alerts, improvement_notes = enrich_alerts_with_history(alerts, trigger_history)

    # Build history context for Gemini
    history_context = None
    if trigger_history:
        escalation_lines = []
        for a in enriched_alerts:
            if a.get('escalation_level') != 'first':
                escalation_lines.append(
                    f"- {a['pattern_type']}: {a['escalation_note']}"
                )
        if improvement_notes:
            escalation_lines.extend(improvement_notes)
        if escalation_lines:
            history_context = "\n".join(escalation_lines)

    # Build sentiment context for traded symbols
    sentiment_context = None
    traded_symbols = set()
    for h in holdings:
        traded_symbols.add(h.get('symbol', ''))
    for a in enriched_alerts:
        if a.get('symbol'):
            traded_symbols.add(a['symbol'])

    if traded_symbols:
        from database import get_cached_sentiment
        sentiment_lines = []
        for sym in list(traded_symbols)[:5]:  # Limit to 5 symbols
            cached = await get_cached_sentiment(sym)
            if cached and cached.get('mood') != 'neutral':
                sentiment_lines.append(
                    f"- {sym}: mood={cached['mood']}, {cached.get('summary', '')}"
                )
        if sentiment_lines:
            sentiment_context = "\n".join(sentiment_lines)

    # Get Gemini feedback for all alerts
    gemini_feedback = await get_gemini_mentor_feedback(enriched_alerts, history_context, sentiment_context)

    # Save triggers to DB and attach feedback
    saved_alerts = []
    for alert in enriched_alerts:
        trigger_id = f"mt-{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"
        feedback = None
        if gemini_feedback and isinstance(gemini_feedback, dict):
            feedback = gemini_feedback.get(alert.get("pattern_type", ""), None)

        await add_mentor_trigger(
            trigger_id, alert["pattern_type"], alert["severity"],
            alert.get("symbol"), alert["message"], feedback,
            datetime.utcnow().isoformat(),
        )
        saved_alerts.append({
            "id": trigger_id,
            "patternType": alert["pattern_type"],
            "severity": alert["severity"],
            "symbol": alert.get("symbol"),
            "message": alert["message"],
            "geminiFeedback": feedback,
            "dismissed": False,
            "createdAt": datetime.utcnow().isoformat(),
            "escalationLevel": alert.get("escalation_level"),
            "priorCount": alert.get("prior_count", 0),
            "escalationNote": alert.get("escalation_note"),
        })

    return {"alerts": saved_alerts, "improvementNotes": improvement_notes}


@app.post("/api/mentor/dismiss/{trigger_id}")
async def mentor_dismiss(trigger_id: str):
    """Dismiss a mentor trigger."""
    await dismiss_mentor_trigger(trigger_id)
    return {"success": True}


@app.get("/api/mentor/history")
async def mentor_history(limit: int = Query(50)):
    """Get mentor trigger history."""
    triggers = await get_mentor_triggers(limit)
    return {"triggers": triggers}


# ============================================================================
# EVALUATION / SCORING
# ============================================================================

@app.get("/api/evaluation/scores")
async def evaluation_get_scores():
    """Get current 30-day rolling scores."""
    latest = await get_latest_daily_score()
    if not latest:
        return {"scores": None, "eligible": False}

    # Check eligibility from daily scores
    daily = await get_daily_scores(30)
    trade_count = sum(d.get("trade_count", 0) for d in daily)
    active_days = sum(1 for d in daily if d.get("active_day", False))

    from scoring_engine import check_eligibility, compute_data_sufficiency

    eligible = check_eligibility(trade_count, active_days)

    # Compute data sufficiency at read time
    holdings = await get_holdings()
    checklists = await get_checklists_raw(30)
    transactions = await get_transactions()
    cutoff = (datetime.utcnow() - timedelta(days=30)).isoformat()
    recent_txns = [t for t in transactions if t.get("timestamp", "") >= cutoff]
    mentor_triggers = await get_mentor_triggers_raw(30)

    insufficient_data = compute_data_sufficiency(
        holdings, checklists, recent_txns, mentor_triggers,
        daily, len(recent_txns),
    )

    return {
        "scores": {
            "date": latest["date"],
            "risk": latest["risk"],
            "discipline": latest["discipline"],
            "strategy": latest["strategy"],
            "psychology": latest["psychology"],
            "consistency": latest["consistency"],
            "eligible": eligible,
            "insufficientData": insufficient_data,
        }
    }


async def _compute_daily_scores_internal() -> Dict:
    """Internal: compute and persist daily scores + badges. Idempotent per date."""
    today = datetime.utcnow().date().isoformat()

    # Gather data
    transactions = await get_transactions()
    holdings = await get_holdings()
    portfolio = await get_portfolio()
    checklists = await get_checklists_raw(30)
    mentor_triggers = await get_mentor_triggers_raw(30)
    daily_history = await get_daily_scores(30)

    # Count trades in last 30 days
    cutoff = (datetime.utcnow() - timedelta(days=30)).isoformat()
    recent_txns = [t for t in transactions if t.get("timestamp", "") >= cutoff]
    trade_count = len(recent_txns)

    # Count active days
    active_dates = set()
    for t in recent_txns:
        ts = t.get("timestamp", "")[:10]
        if ts:
            active_dates.add(ts)
    active_days = len(active_dates)

    scores = compute_all_scores(
        holdings, portfolio.get("balance", 0),
        checklists, recent_txns, mentor_triggers,
        daily_history, active_days, trade_count,
    )

    # Save daily score
    score_id = f"ds-{today}"
    await upsert_daily_score(
        score_id, today,
        scores["risk"], scores["discipline"], scores["strategy"],
        scores["psychology"], scores["consistency"],
        trade_count, active_days > 0,
    )

    # Update badges (pass mentor triggers for sentiment-aware badges)
    updated_daily = await get_daily_scores(30)
    badge_results = evaluate_badges(updated_daily, mentor_triggers)
    now = datetime.utcnow().isoformat()
    for b in badge_results:
        badge_id = f"badge-{b['badge_type']}"
        await upsert_badge(
            badge_id, b["badge_type"], b["earned"], b["active"],
            b["qualifying_days"], now if b["earned"] else None, now,
        )

    return {"success": True, "scores": scores, "badges": badge_results}


@app.post("/api/evaluation/compute")
async def evaluation_compute():
    """Trigger daily score computation (idempotent per date)."""
    return await _compute_daily_scores_internal()


@app.get("/api/evaluation/badges")
async def evaluation_get_badges():
    """Get all badge statuses."""
    badges = await get_badges()
    # Add required_days from definitions
    for b in badges:
        defn = BADGE_DEFINITIONS.get(b.get("badgeType", ""), {})
        b["requiredDays"] = defn.get("days", 21)
    return {"badges": badges}


@app.get("/api/evaluation/report/latest")
async def evaluation_latest_report():
    """Get the most recent monthly report."""
    report = await get_latest_report()
    return {"report": report}


@app.get("/api/evaluation/report/history")
async def evaluation_report_history(limit: int = Query(12)):
    """Get report history."""
    reports = await get_report_history(limit)
    return {"reports": reports}


@app.post("/api/evaluation/report/generate")
async def evaluation_generate_report():
    """Generate a monthly report."""
    now = datetime.utcnow()
    period_end = now.date().isoformat()
    period_start = (now - timedelta(days=30)).date().isoformat()

    # Get scores
    daily = await get_daily_scores(30)
    if not daily:
        return {"error": "No daily scores available. Compute scores first."}

    # Average scores
    score_keys = ["risk_score", "discipline_score", "strategy_score", "psychology_score", "consistency_score"]
    avgs = {}
    for key in score_keys:
        vals = [d.get(key, 0) for d in daily if d.get(key, 0) > 0]
        short_key = key.replace("_score", "")
        avgs[short_key] = round(sum(vals) / len(vals), 1) if vals else 0

    grade = compute_overall_grade(avgs)

    # Best/worst trade
    transactions = await get_transactions()
    cutoff = (now - timedelta(days=30)).isoformat()
    recent = [t for t in transactions if t.get("timestamp", "") >= cutoff]
    sells = [t for t in recent if t.get("action") == "sell"]

    best_trade = None
    worst_trade = None
    if sells:
        # Simple: best = highest total, worst = lowest total (for sells)
        sells_sorted = sorted(sells, key=lambda s: s.get("total", 0))
        worst_trade = sells_sorted[0]
        best_trade = sells_sorted[-1]

    # Detected patterns
    triggers = await get_mentor_triggers_raw(30)
    patterns = list(set(t.get("pattern_type", "") for t in triggers if t.get("pattern_type")))

    # Gather enrichment data for deeper report
    # Trend data: current vs previous 30-day averages
    daily_60 = await get_daily_scores(60)
    cutoff_30 = (now - timedelta(days=30)).date().isoformat()
    current_window = [d for d in daily_60 if d.get("date", "") >= cutoff_30]
    previous_window = [d for d in daily_60 if d.get("date", "") < cutoff_30]

    def _avg_window(window):
        result = {}
        for key in score_keys:
            vals = [d.get(key, 0) for d in window if d.get(key, 0) > 0]
            result[key.replace("_score", "")] = round(sum(vals) / len(vals), 1) if vals else 0
        return result

    trend_data = {
        "current": _avg_window(current_window),
        "previous": _avg_window(previous_window),
    }

    # Pattern frequency
    pattern_frequency = {}
    for t in triggers:
        pt = t.get("pattern_type", "")
        if pt:
            pattern_frequency[pt] = pattern_frequency.get(pt, 0) + 1

    # Checklist stats
    checklist_stats_data = await get_checklist_stats(30)

    # Trade stats
    buys = [t for t in recent if t.get("action") == "buy"]
    trade_stats = {
        "total": len(recent),
        "buys": len(buys),
        "sells": len(sells),
        "avgHoldingDays": "N/A",
    }

    # Build sentiment context for report
    report_sentiment_ctx = None
    traded_syms = set(t.get('symbol', '') for t in recent if t.get('symbol'))
    if traded_syms:
        from database import get_cached_sentiment
        sent_lines = []
        for sym in list(traded_syms)[:5]:
            cached_sent = await get_cached_sentiment(sym)
            if cached_sent:
                sent_lines.append(
                    f"  {sym}: {cached_sent.get('mood', 'neutral')} — {cached_sent.get('summary', 'N/A')}"
                )
        if sent_lines:
            report_sentiment_ctx = "\n".join(sent_lines)

    # Gemini summary with enriched data
    summary = await generate_report_summary(
        avgs, grade, patterns, best_trade, worst_trade,
        trend_data=trend_data,
        pattern_frequency=pattern_frequency,
        checklist_stats=checklist_stats_data,
        trade_stats=trade_stats,
        sentiment_context=report_sentiment_ctx,
    )

    # Badge updates
    badges = await get_badges()
    badge_updates = []
    for b in badges:
        badge_updates.append({
            "badgeType": b.get("badgeType", ""),
            "change": "earned" if b.get("earned") else "maintained" if b.get("qualifyingDays", 0) > 0 else "lost",
        })

    report_id = f"rpt-{int(now.timestamp() * 1000)}"
    await add_monthly_report(
        report_id, period_start, period_end,
        avgs.get("risk", 0), avgs.get("discipline", 0), avgs.get("strategy", 0),
        avgs.get("psychology", 0), avgs.get("consistency", 0),
        grade,
        best_trade.get("id") if best_trade else None,
        worst_trade.get("id") if worst_trade else None,
        json.dumps(patterns), summary, json.dumps(badge_updates),
        now.isoformat(),
    )

    report = await get_latest_report()
    return {"report": report}


# ============================================================================
# CHALLENGES
# ============================================================================

@app.get("/api/challenges")
async def challenges_get_active():
    """Get active challenges with current progress."""
    active = await get_active_challenges()

    # If no active challenges, seed them
    if not active:
        now = datetime.utcnow()
        for tmpl in CHALLENGE_TEMPLATES:
            challenge_id = f"ch-{tmpl['challenge_type']}-{int(now.timestamp() * 1000)}"
            expires = (now + timedelta(days=tmpl["duration_days"])).isoformat()
            await add_challenge(
                challenge_id, tmpl["challenge_type"], tmpl["title"],
                tmpl["description"], tmpl["target_value"],
                now.isoformat(), expires,
            )
        active = await get_active_challenges()

    # Compute current progress for each
    transactions = await get_transactions()
    holdings = await get_holdings()
    portfolio = await get_portfolio()
    checklists_raw = await get_checklists_raw(30)

    for ch in active:
        progress_val = compute_challenge_progress(
            ch["challengeType"], holdings, portfolio.get("balance", 0),
            transactions, checklists_raw,
        )
        ch["currentValue"] = progress_val
        ch["progress"] = min(round((progress_val / ch["targetValue"] * 100) if ch["targetValue"] > 0 else 0, 1), 100)

    return {"challenges": active}


@app.post("/api/challenges/refresh")
async def challenges_refresh():
    """Recompute progress and rotate expired challenges."""
    now = datetime.utcnow()

    active = await get_active_challenges()
    transactions = await get_transactions()
    holdings = await get_holdings()
    portfolio = await get_portfolio()
    checklists_raw = await get_checklists_raw(30)

    for ch in active:
        progress_val = compute_challenge_progress(
            ch["challengeType"], holdings, portfolio.get("balance", 0),
            transactions, checklists_raw,
        )

        # Check if completed
        if progress_val >= ch["targetValue"]:
            await update_challenge(ch["id"], progress_val, "completed", now.isoformat())
        elif now.isoformat() > ch["expiresAt"]:
            await update_challenge(ch["id"], progress_val, "expired")
        else:
            await update_challenge(ch["id"], progress_val, "active")

    # Re-seed any missing challenge types
    remaining = await get_active_challenges()
    active_types = {c["challengeType"] for c in remaining}
    for tmpl in CHALLENGE_TEMPLATES:
        if tmpl["challenge_type"] not in active_types:
            challenge_id = f"ch-{tmpl['challenge_type']}-{int(now.timestamp() * 1000)}"
            expires = (now + timedelta(days=tmpl["duration_days"])).isoformat()
            await add_challenge(
                challenge_id, tmpl["challenge_type"], tmpl["title"],
                tmpl["description"], tmpl["target_value"],
                now.isoformat(), expires,
            )

    updated = await get_active_challenges()
    return {"challenges": updated}


@app.get("/api/challenges/history")
async def challenges_history(limit: int = Query(20)):
    """Get past challenge completions."""
    history = await get_challenge_history(limit)
    return {"challenges": history}


@app.get("/api/evaluation/profile")
async def evaluation_profile():
    """Get trader profile."""
    latest = await get_latest_daily_score()
    badges = await get_badges()
    transactions = await get_transactions()

    daily = await get_daily_scores(30)
    active_days = sum(1 for d in daily if d.get("active_day", False))
    completed = await get_completed_challenge_count()

    profile = await compute_trader_profile(
        latest, badges, transactions, active_days, completed,
    )
    return {"profile": profile}


# ============================================================================
# TRADE JOURNAL
# ============================================================================

VALID_MOODS = {'confident', 'anxious', 'neutral', 'frustrated', 'excited'}

@app.post("/api/journal")
async def journal_create(entry: JournalEntryRequest):
    """Create a new journal entry."""
    if entry.mood not in VALID_MOODS:
        raise HTTPException(status_code=400, detail=f"Invalid mood. Must be one of: {', '.join(VALID_MOODS)}")
    if not entry.symbol or not entry.note:
        raise HTTPException(status_code=400, detail="Symbol and note are required")

    entry_id = f"j-{int(datetime.utcnow().timestamp() * 1000)}-{uuid.uuid4().hex[:8]}"
    created_at = datetime.utcnow().isoformat()

    await add_journal_entry(
        entry_id, entry.transaction_id, entry.symbol,
        entry.mood, entry.note, created_at,
    )

    return {
        "entry": {
            "id": entry_id,
            "transactionId": entry.transaction_id,
            "symbol": entry.symbol,
            "mood": entry.mood,
            "note": entry.note,
            "createdAt": created_at,
        }
    }


@app.get("/api/journal")
async def journal_list(limit: int = Query(50), offset: int = Query(0)):
    """Get journal entries."""
    entries = await get_journal_entries(limit, offset)
    return {"entries": entries}


@app.get("/api/journal/symbol/{symbol}")
async def journal_by_symbol(symbol: str):
    """Get journal entries for a specific symbol."""
    entries = await get_journal_entries_for_symbol(symbol)
    return {"entries": entries}


@app.get("/api/journal/transaction/{transaction_id}")
async def journal_by_transaction(transaction_id: str):
    """Get journal entries for a specific transaction."""
    entries = await get_journal_entries_for_transaction(transaction_id)
    return {"entries": entries}


# ============================================================================
# BEHAVIOR SUMMARY (Long-term tracking)
# ============================================================================

@app.get("/api/evaluation/behavior-summary")
async def evaluation_behavior_summary():
    """Get long-term behavior tracking summary."""
    all_scores = await get_all_daily_scores()
    trigger_counts = await get_trigger_counts_by_type()

    summary = compute_behavior_summary(all_scores, trigger_counts)
    return {"summary": summary}


# ============================================================================
# SENTIMENT ANALYSIS
# ============================================================================

class SentimentBatchRequest(BaseModel):
    symbols: List[Dict[str, str]]  # [{symbol, name}]


@app.get("/api/sentiment")
async def sentiment_get(
    symbol: str = Query(..., description="Stock/crypto symbol"),
    name: str = Query("", description="Company/asset name"),
):
    """Get sentiment analysis for a single asset."""
    result = await get_sentiment(symbol.upper(), name or symbol)
    return result


@app.post("/api/sentiment/batch")
async def sentiment_batch(req: SentimentBatchRequest):
    """Get sentiment for multiple assets at once."""
    results = await get_sentiment_batch(req.symbols)
    return {"sentiments": results}


@app.get("/api/sentiment/history")
async def sentiment_history_endpoint(
    symbol: str = Query(..., description="Stock/crypto symbol"),
    days: int = Query(30, description="Number of days of history"),
):
    """Get historical sentiment snapshots for a symbol."""
    history = await get_sentiment_history(symbol.upper(), days)
    return {"history": history}


# ============================================================================
# DIVERGENCE
# ============================================================================

# In-memory cache for divergence results (30-min TTL)
_divergence_cache: Dict[str, Dict] = {}
_divergence_cache_ts: Dict[str, float] = {}
DIVERGENCE_CACHE_TTL = 1800  # 30 minutes

DIVERGENCE_SIGNALS = {
    "caution_zone": {
        "label": "Caution Zone",
        "description": "Price has been rising despite predominantly negative news sentiment. This divergence is worth monitoring for educational awareness.",
    },
    "recovery_watch": {
        "label": "Recovery Watch",
        "description": "Price has been declining while news sentiment remains positive. Historically, such divergences can resolve in either direction.",
    },
    "strong_trend": {
        "label": "Confirmed Trend",
        "description": "Positive price momentum is supported by positive news sentiment. Both indicators are aligned.",
    },
    "weak_trend": {
        "label": "Weak Trend",
        "description": "Declining price is confirmed by negative news sentiment. Both indicators suggest continued weakness.",
    },
    "neutral": {
        "label": "No Divergence",
        "description": "Price movement and sentiment are not showing a notable divergence pattern.",
    },
}


@app.get("/api/sentiment/divergence")
async def sentiment_divergence(
    symbol: str = Query(..., description="Stock/crypto symbol"),
    name: str = Query("", description="Company/asset name"),
):
    """Detect price-sentiment divergence for educational insight."""
    import time

    sym = symbol.upper()
    now = time.time()

    # Check cache
    if sym in _divergence_cache and (now - _divergence_cache_ts.get(sym, 0)) < DIVERGENCE_CACHE_TTL:
        return _divergence_cache[sym]

    try:
        # 1. Fetch 30D historical data
        hist_result = await fetch_yfinance_historical(sym, "1M")
        hist_data = hist_result.get("data", [])

        # 2. Get sentiment (will hit cache if available)
        sentiment_result = await get_sentiment(sym, name or sym)

        # 3. Compute price change
        price_change_pct = 0.0
        if len(hist_data) >= 2:
            first_close = hist_data[0].get("close", 0)
            last_close = hist_data[-1].get("close", 0)
            if first_close > 0:
                price_change_pct = round(((last_close - first_close) / first_close) * 100, 2)

        # 4. Get sentiment percentages
        positive_pct = sentiment_result.get("positive_pct", 0)
        negative_pct = sentiment_result.get("negative_pct", 0)
        mood = sentiment_result.get("mood", "neutral")

        # 5. Apply divergence rules
        signal = "neutral"
        if price_change_pct > 5 and negative_pct > 45:
            signal = "caution_zone"
        elif price_change_pct < -5 and positive_pct > 45:
            signal = "recovery_watch"
        elif price_change_pct > 0 and positive_pct > negative_pct:
            signal = "strong_trend"
        elif price_change_pct < 0 and negative_pct > positive_pct:
            signal = "weak_trend"

        sig_info = DIVERGENCE_SIGNALS[signal]
        result = {
            "symbol": sym,
            "signal": signal,
            "label": sig_info["label"],
            "description": sig_info["description"],
            "price_change_30d_pct": price_change_pct,
            "sentiment_mood": mood,
            "positive_pct": positive_pct,
            "negative_pct": negative_pct,
            "educational_only": True,
        }

        # Cache result
        _divergence_cache[sym] = result
        _divergence_cache_ts[sym] = now

        # Save snapshot to DB in background
        try:
            await save_divergence_snapshot(sym, signal, price_change_pct, mood)
        except Exception as e:
            print(f"Failed to save divergence snapshot: {e}")

        return result

    except Exception as e:
        print(f"Divergence calculation error for {sym}: {e}")
        return {
            "symbol": sym,
            "signal": "neutral",
            "label": "Unavailable",
            "description": "Could not compute divergence at this time.",
            "price_change_30d_pct": 0,
            "sentiment_mood": "neutral",
            "positive_pct": 0,
            "negative_pct": 0,
            "educational_only": True,
        }


if __name__ == "__main__":
    import uvicorn

    print("="*60)
    print("StockMind Python API Server - yfinance (FREE)")
    print("="*60)
    print(f"Server: http://127.0.0.1:8000")
    print(f"API docs: http://127.0.0.1:8000/docs")
    print("-"*60)
    print("Data Sources:")
    print("  - yfinance: Stock prices & historical data (PRIMARY, FREE)")
    print("  - NSE: Indian stocks (if nsetools installed)")
    print("  - Wikipedia: Company descriptions")
    print("  - Gemini: AI competitor analysis (if configured)")
    print("-"*60)
    print(f"yfinance: {'Available' if YFINANCE_AVAILABLE else 'NOT available'}")
    print(f"Gemini: {'Configured' if GEMINI_API_KEY else 'NOT configured'}")
    print("="*60)

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
