#!/usr/bin/env python3
import sys
import json
import requests
from datetime import datetime

try:
    import yfinance as yf
except ImportError:
    print(json.dumps({"error": "yfinance module not installed. Run: pip install yfinance"}))
    sys.exit(1)

if len(sys.argv) < 3:
    print(json.dumps({"error": "Usage: python stock_data.py <operation> <params_json>"}))
    sys.exit(1)

operation = sys.argv[1]
params_json = sys.argv[2]

try:
    params = json.loads(params_json)
except json.JSONDecodeError:
    print(json.dumps({"error": "Invalid JSON parameters"}))
    sys.exit(1)

def get_quote(symbol):
    """Get stock quote data"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info

        # Check if valid ticker
        if not info or 'symbol' not in info:
            return {"error": "Stock not found"}

        # Get current price - try multiple fields as yfinance can be inconsistent
        price = (info.get('currentPrice') or
                info.get('regularMarketPrice') or
                info.get('previousClose') or 0)

        # Get previous close for change calculation
        prev_close = info.get('previousClose') or info.get('regularMarketPreviousClose') or 0

        # Calculate change if we have both values
        change = info.get('regularMarketChange')
        if change is None and price and prev_close:
            change = price - prev_close
        else:
            change = change or 0

        # Calculate change percent
        change_percent = info.get('regularMarketChangePercent')
        if change_percent is None and prev_close and prev_close != 0:
            change_percent = (change / prev_close) * 100
        else:
            change_percent = change_percent or 0

        result = {
            "symbol": info.get('symbol', symbol).upper(),
            "name": info.get('longName') or info.get('shortName') or symbol,
            "price": float(price),
            "change": float(change),
            "changePercent": float(change_percent),
            "preMarket": float(info.get('preMarketPrice')) if info.get('preMarketPrice') else None,
            "previousClose": float(prev_close),
            "dayLow": float(info.get('regularMarketDayLow') or info.get('dayLow') or 0),
            "dayHigh": float(info.get('regularMarketDayHigh') or info.get('dayHigh') or 0),
            "yearLow": float(info.get('fiftyTwoWeekLow') or 0),
            "yearHigh": float(info.get('fiftyTwoWeekHigh') or 0),
            "marketCap": int(info.get('marketCap') or 0),
            "volume": int(info.get('volume') or info.get('regularMarketVolume') or 0),
            "avgVolume": int(info.get('averageVolume') or info.get('averageDailyVolume3Month') or 0),
            "pe": float(info.get('trailingPE') or info.get('forwardPE') or 0) if (info.get('trailingPE') or info.get('forwardPE')) else None,
            "eps": float(info.get('trailingEps') or 0) if info.get('trailingEps') else None,
            "dividend": float(info.get('dividendRate') or 0) if info.get('dividendRate') else None,
            "dividendYield": float(info.get('dividendYield') * 100) if info.get('dividendYield') else None,
            "exchange": info.get('exchange') or info.get('fullExchangeName') or '',
            "currency": info.get('currency') or 'USD',
            "description": info.get('longBusinessSummary') or None,
        }

        return result
    except Exception as e:
        return {"error": f"Failed to fetch quote: {str(e)}"}

def search_stocks(query):
    """
    Search for stocks using lightweight ticker validation.
    Uses history() first for validation (lighter than .info).
    Returns error objects on failure instead of empty arrays.
    """
    try:
        # Use history() for lightweight validation (avoids heavy .info call initially)
        ticker = yf.Ticker(query.upper())
        hist = ticker.history(period="1d")

        if hist.empty:
            # Try lowercase
            ticker = yf.Ticker(query.lower())
            hist = ticker.history(period="1d")
            if hist.empty:
                return []

        # Now get basic info (still needed for company name, etc.)
        symbol = ticker.ticker
        try:
            info = ticker.info
            name = info.get('longName') or info.get('shortName') or symbol
            price = info.get('currentPrice') or info.get('regularMarketPrice') or hist['Close'].iloc[-1]
            change = info.get('regularMarketChange', 0)
            change_percent = info.get('regularMarketChangePercent', 0)
            exchange = info.get('exchange') or info.get('fullExchangeName') or ''
            country = info.get('country') or ''
            currency = info.get('currency') or 'USD'
        except:
            # Fallback if .info fails - use historical data
            name = symbol
            price = hist['Close'].iloc[-1]
            change = 0
            change_percent = 0
            exchange = ''
            country = ''
            currency = 'USD'

        result = {
            "symbol": symbol,
            "name": name,
            "exchange": exchange,
            "country": country,
            "price": float(price),
            "change": float(change),
            "changePercent": float(change_percent),
            "currency": currency,
        }

        return [result]

    except requests.exceptions.HTTPError as e:
        # Handle HTTP errors (like 429 rate limiting)
        if hasattr(e, 'response') and e.response.status_code == 429:
            return {
                "error": "Rate limit exceeded. Please wait a moment and try again.",
                "type": "rate_limit",
                "status_code": 429
            }
        return {
            "error": f"HTTP error: {str(e)}",
            "type": "http_error"
        }
    except Exception as e:
        # Return error object instead of empty array
        return {
            "error": str(e),
            "type": "search_error"
        }

def get_historical(symbol, range_param):
    """Get historical data for charts"""
    try:
        ticker = yf.Ticker(symbol)

        # Map range to yfinance parameters
        range_map = {
            '1D': {'period': '1d', 'interval': '5m'},
            '5D': {'period': '5d', 'interval': '15m'},
            '1M': {'period': '1mo', 'interval': '1d'},
            '6M': {'period': '6mo', 'interval': '1d'},
            '1Y': {'period': '1y', 'interval': '1d'},
            'MAX': {'period': 'max', 'interval': '1wk'},
        }

        params = range_map.get(range_param, {'period': '1mo', 'interval': '1d'})
        hist = ticker.history(period=params['period'], interval=params['interval'])

        if hist.empty:
            return {"error": "No historical data available"}

        # Convert DataFrame to list of dicts
        data = []
        for timestamp, row in hist.iterrows():
            data.append({
                'time': int(timestamp.timestamp()),  # Unix timestamp
                'value': float(row['Close']),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
            })

        return {"data": data}
    except Exception as e:
        return {"error": f"Failed to fetch historical data: {str(e)}"}

def get_summary(market):
    """Get market summary indices"""
    try:
        # Market index mapping
        market_map = {
            'US': ['^GSPC', '^DJI', '^IXIC'],
            'India': ['^NSEI', '^BSESN'],
            'Europe': ['^FTSE', '^GDAXI', '^FCHI'],
            'global': ['^GSPC', '^DJI', '^IXIC', '^NSEI'],
        }

        indices_symbols = market_map.get(market, market_map['US'])
        indices = []

        for symbol in indices_symbols:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info

                price = (info.get('currentPrice') or
                        info.get('regularMarketPrice') or
                        info.get('previousClose') or 0)

                change = info.get('regularMarketChange') or 0
                change_percent = info.get('regularMarketChangePercent') or 0

                # Index name mapping
                name_map = {
                    '^GSPC': 'S&P 500',
                    '^DJI': 'Dow Jones',
                    '^IXIC': 'Nasdaq',
                    '^NSEI': 'Nifty 50',
                    '^BSESN': 'Sensex',
                    '^FTSE': 'FTSE 100',
                    '^GDAXI': 'DAX',
                    '^FCHI': 'CAC 40',
                }

                indices.append({
                    "symbol": symbol,
                    "name": name_map.get(symbol, info.get('shortName') or symbol),
                    "price": float(price),
                    "change": float(change),
                    "changePercent": float(change_percent),
                })
            except:
                continue

        return {
            "indices": indices,
            "futures": [],
            "mostActive": [],
            "gainers": [],
            "losers": [],
        }
    except Exception as e:
        return {"error": f"Failed to fetch summary: {str(e)}"}

# Route to appropriate function
try:
    if operation == 'quote':
        result = get_quote(params.get('symbol', ''))
    elif operation == 'search':
        result = search_stocks(params.get('query', ''))
    elif operation == 'historical':
        result = get_historical(params.get('symbol', ''), params.get('range', '1M'))
    elif operation == 'summary':
        result = get_summary(params.get('market', 'US'))
    else:
        result = {"error": f"Unknown operation: {operation}"}

    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
