"""
Sentiment Engine: Fetches financial news and classifies sentiment
using Gemini AI. Provides educational market mood indicators.
All analysis is descriptive — no predictions or advice.
"""

import os
import json
import asyncio
import httpx
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from html import unescape

# Import Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from dotenv import load_dotenv
load_dotenv(override=True)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")

if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

if not GEMINI_API_KEY:
    print("[Sentiment] WARNING: No GEMINI_API_KEY found in environment")

# Keyword lists for fallback sentiment classification
POSITIVE_KEYWORDS = {
    "rally", "surge", "gain", "rise", "jump", "soar", "beat", "upgrade",
    "record", "growth", "profit", "bullish", "boost", "high", "strong",
    "recover", "outperform", "optimistic", "expand", "breakthrough",
}
NEGATIVE_KEYWORDS = {
    "fall", "drop", "decline", "crash", "loss", "plunge", "miss", "downgrade",
    "cut", "weak", "bear", "bearish", "sell-off", "selloff", "low", "slump",
    "tumble", "warning", "layoff", "recession", "default", "bankruptcy",
}

# Default neutral result for fallback
NEUTRAL_RESULT = {
    "positive_pct": 0.0,
    "neutral_pct": 100.0,
    "negative_pct": 0.0,
    "mixed_pct": 0.0,
    "mood": "neutral",
    "summary": "Insufficient news data available for sentiment analysis.",
    "article_count": 0,
    "classified_articles": [],
}


async def fetch_news_google_rss(
    symbol: str, company_name: str
) -> List[Dict[str, str]]:
    """Fallback: fetch news from Google News RSS (free, no API key).
    Returns list of {title, description, source} dicts.
    """
    # Build a search query — use clean symbol + company name
    clean_symbol = symbol.replace(".NS", "").replace(".BO", "")
    query_parts = [clean_symbol]
    if company_name and company_name != symbol:
        name_parts = company_name.split()[:2]
        query_parts.append(" ".join(name_parts))
    search_query = " ".join(query_parts) + " stock"

    url = f"https://news.google.com/rss/search?q={search_query}&hl=en&gl=US&ceid=US:en"

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()

        root = ET.fromstring(resp.text)
        articles = []

        # RSS items are under <channel><item>
        for item in root.findall(".//item"):
            title_el = item.find("title")
            source_el = item.find("source")
            desc_el = item.find("description")

            title = unescape(title_el.text.strip()) if title_el is not None and title_el.text else ""
            source = source_el.text.strip() if source_el is not None and source_el.text else "Google News"
            description = unescape(desc_el.text.strip()) if desc_el is not None and desc_el.text else ""

            if not title:
                continue

            # Preserve link and publication date from RSS
            # Google News RSS stores the URL as tail text after the <link/> element,
            # not as .text inside it. Fall back to source element's url attribute.
            link_el = item.find("link")
            pub_date_el = item.find("pubDate")
            link_url = ""
            if link_el is not None:
                link_url = (link_el.text or "").strip() or (link_el.tail or "").strip()
            if not link_url and source_el is not None:
                link_url = (source_el.get("url") or "").strip()
            url = link_url
            published_at = pub_date_el.text.strip() if pub_date_el is not None and pub_date_el.text else ""

            articles.append({
                "title": title,
                "description": description[:300],
                "source": source,
                "url": url,
                "publishedAt": published_at,
                "urlToImage": "",
            })

            if len(articles) >= 20:
                break

        return articles

    except Exception as e:
        print(f"[Sentiment] Google News RSS error for {symbol}: {e}")
        return []


async def fetch_news_for_symbol(
    symbol: str, company_name: str, days: int = 14
) -> List[Dict[str, str]]:
    """Fetch recent financial news articles for a symbol from NewsAPI.
    Returns list of {title, description, source} dicts.
    """
    if not NEWS_API_KEY:
        print(f"[Sentiment] NEWS_API_KEY not configured — trying Google News RSS for {symbol}")
        return await fetch_news_google_rss(symbol, company_name)

    # Build search query from symbol and company name
    query_parts = [symbol.replace(".NS", "").replace(".BO", "")]
    if company_name and company_name != symbol:
        # Use first two words of company name to avoid overly long queries
        name_parts = company_name.split()[:2]
        query_parts.append(" ".join(name_parts))
    search_query = " OR ".join(query_parts)

    from_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": search_query,
                    "from": from_date,
                    "sortBy": "relevancy",
                    "language": "en",
                    "pageSize": 20,
                    "apiKey": NEWS_API_KEY,
                },
            )
            data = resp.json()

        if data.get("status") != "ok":
            print(f"[Sentiment] NewsAPI error for {symbol}: {data.get('message', 'unknown')}")
            print(f"[Sentiment] Falling back to Google News RSS for {symbol}")
            return await fetch_news_google_rss(symbol, company_name)

        articles = []
        for article in data.get("articles", [])[:20]:
            title = article.get("title", "")
            description = article.get("description", "")
            source = article.get("source", {}).get("name", "Unknown")

            # Skip non-financial or irrelevant articles
            if not title or title == "[Removed]":
                continue

            articles.append({
                "title": title,
                "description": description or "",
                "source": source,
                "url": article.get("url", ""),
                "publishedAt": article.get("publishedAt", ""),
                "urlToImage": article.get("urlToImage", ""),
            })

        print(f"[Sentiment] NewsAPI returned {len(articles)} articles for {symbol}")

        # Fallback to Google News RSS if NewsAPI returned nothing
        if not articles:
            print(f"[Sentiment] NewsAPI returned 0 articles — falling back to Google News RSS for {symbol}")
            articles = await fetch_news_google_rss(symbol, company_name)
            print(f"[Sentiment] Google News RSS returned {len(articles)} articles for {symbol}")

        return articles

    except Exception as e:
        print(f"[Sentiment] NewsAPI fetch error for {symbol}: {e}")
        print(f"[Sentiment] Falling back to Google News RSS for {symbol}")
        return await fetch_news_google_rss(symbol, company_name)


def classify_sentiment_keywords(
    articles: List[Dict[str, str]], symbol: str
) -> Dict[str, Any]:
    """Keyword-based sentiment classifier — no external API needed.
    Counts positive/negative financial keyword hits per article.
    """
    if not articles:
        return {**NEUTRAL_RESULT}

    classified = []
    counts = {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0}

    for art in articles[:20]:
        text = f"{art.get('title', '')} {art.get('description', '')}".lower()
        pos = sum(1 for kw in POSITIVE_KEYWORDS if kw in text)
        neg = sum(1 for kw in NEGATIVE_KEYWORDS if kw in text)

        if pos > neg:
            sentiment = "positive"
        elif neg > pos:
            sentiment = "negative"
        elif pos > 0 and neg > 0:
            sentiment = "mixed"
        else:
            sentiment = "neutral"

        counts[sentiment] += 1
        classified.append({
            "title": art.get("title", ""),
            "sentiment": sentiment,
            "source": art.get("source", "Unknown"),
            "url": art.get("url", ""),
            "description": art.get("description", ""),
            "publishedAt": art.get("publishedAt", ""),
            "urlToImage": art.get("urlToImage", ""),
        })

    total = len(classified)
    pcts = {k: round(v / total * 100, 1) for k, v in counts.items()}

    # Determine dominant mood
    mood = max(counts, key=counts.get)
    if counts[mood] == 0 or list(counts.values()).count(counts[mood]) > 1:
        mood = "mixed"

    # Generate simple summary
    mood_desc = {
        "positive": f"Recent news about {symbol} leans positive, with headlines highlighting gains and optimism.",
        "negative": f"Recent news about {symbol} leans negative, with headlines noting declines or concerns.",
        "mixed": f"Recent news about {symbol} shows a mix of positive and negative headlines.",
        "neutral": f"Recent news about {symbol} is largely neutral, without strong positive or negative signals.",
    }

    return {
        "positive_pct": pcts["positive"],
        "neutral_pct": pcts["neutral"],
        "negative_pct": pcts["negative"],
        "mixed_pct": pcts["mixed"],
        "mood": mood,
        "summary": mood_desc.get(mood, mood_desc["neutral"]),
        "article_count": total,
        "classified_articles": classified,
    }


async def classify_sentiment_gemini(
    articles: List[Dict[str, str]], symbol: str
) -> Dict[str, Any]:
    """Use Gemini to classify the sentiment of news articles.
    Returns mood breakdown and per-article classifications.
    """
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        print(f"[Sentiment] Gemini unavailable — using keyword fallback for {symbol}")
        return classify_sentiment_keywords(articles, symbol)

    if not articles:
        return {**NEUTRAL_RESULT}

    # Build article list for the prompt
    article_lines = []
    for i, art in enumerate(articles[:20], 1):
        article_lines.append(f"{i}. [{art['source']}] {art['title']}")
        if art.get("description"):
            article_lines.append(f"   {art['description'][:200]}")

    articles_text = "\n".join(article_lines)

    prompt = f"""Classify the sentiment of each news article below about {symbol}.

For each article, assign exactly one sentiment: "positive", "neutral", "negative", or "mixed".
Then compute the overall percentage breakdown and determine the dominant mood.
Write a 1-2 sentence educational summary describing the recent news tone (NOT predicting future movement).

Articles:
{articles_text}

Return ONLY a JSON object with this exact structure:
{{
  "positive_pct": <float 0-100>,
  "neutral_pct": <float 0-100>,
  "negative_pct": <float 0-100>,
  "mixed_pct": <float 0-100>,
  "mood": "positive"|"neutral"|"negative"|"mixed",
  "summary": "<1-2 sentence educational summary of recent news tone>",
  "classified_articles": [
    {{"title": "<title>", "sentiment": "positive"|"neutral"|"negative"|"mixed", "source": "<source>"}}
  ]
}}

Rules:
- Percentages must sum to 100.
- mood = whichever category has the highest percentage. If tied, use "mixed".
- Summary must describe observed tone, NOT predict price movement or give advice.
- Return ONLY the JSON. No preamble, no markdown blocks."""

    try:
        model = genai.GenerativeModel("gemini-2.0-flash-lite")
        response = await model.generate_content_async(prompt)
        text = response.text.strip()

        # Clean markdown wrappers
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3].strip()
        if text.startswith("json"):
            text = text[4:].strip()

        result = json.loads(text)

        # Validate and ensure required fields
        result.setdefault("positive_pct", 0.0)
        result.setdefault("neutral_pct", 100.0)
        result.setdefault("negative_pct", 0.0)
        result.setdefault("mixed_pct", 0.0)
        result.setdefault("mood", "neutral")
        result.setdefault("summary", "News sentiment analysis completed.")
        result.setdefault("classified_articles", [])

        # Merge full metadata back into Gemini's classified articles
        # (Gemini only returns title/sentiment/source — enrich with url, description, etc.)
        article_lookup = {}
        for art in articles[:20]:
            article_lookup[art.get("title", "").strip().lower()] = art

        for classified in result["classified_articles"]:
            key = classified.get("title", "").strip().lower()
            if key in article_lookup:
                orig = article_lookup[key]
                classified.setdefault("url", orig.get("url", ""))
                classified.setdefault("description", orig.get("description", ""))
                classified.setdefault("publishedAt", orig.get("publishedAt", ""))
                classified.setdefault("urlToImage", orig.get("urlToImage", ""))

        result["article_count"] = len(result["classified_articles"])

        return result

    except Exception as e:
        print(f"[Sentiment] Gemini failed for {symbol}: {e} — using keyword fallback")
        return classify_sentiment_keywords(articles, symbol)


async def get_sentiment(symbol: str, company_name: str) -> Dict[str, Any]:
    """Main orchestrator: check cache -> fetch news -> classify -> cache -> return.
    Uses database cache with 24h TTL.
    """
    from database import get_cached_sentiment, save_sentiment_cache, save_sentiment_snapshot

    # 1. Check cache (invalidate stale entries missing enriched fields)
    cached = await get_cached_sentiment(symbol)
    if cached:
        classified = cached.get("classified_articles", [])
        if classified and "url" not in classified[0]:
            print(f"[Sentiment] Stale cache for {symbol} (missing url field) — re-fetching")
            cached = None
        else:
            print(f"[Sentiment] Cache hit for {symbol} — mood: {cached.get('mood')}, articles: {cached.get('article_count')}")
            return cached

    print(f"[Sentiment] Cache miss for {symbol} — fetching fresh news...")

    # 2. Fetch news
    articles = await fetch_news_for_symbol(symbol, company_name)

    # 3. Classify
    if not articles:
        print(f"[Sentiment] No articles found for {symbol} — returning neutral")
        result = {**NEUTRAL_RESULT}
    else:
        print(f"[Sentiment] Classifying {len(articles)} articles for {symbol} with Gemini...")
        result = await classify_sentiment_gemini(articles, symbol)
        print(f"[Sentiment] Classification complete for {symbol} — mood: {result.get('mood')}")

    # 4. Cache result (short TTL for neutral/empty, full TTL for real results)
    is_empty = result.get("article_count", 0) == 0
    await save_sentiment_cache(symbol, result, short_ttl=is_empty)

    # 5. Save historical snapshot
    await save_sentiment_snapshot(symbol, result)

    return result


async def get_sentiment_batch(
    symbols_with_names: List[Dict[str, str]],
) -> Dict[str, Dict[str, Any]]:
    """Batch sentiment fetch for multiple symbols.
    Returns {symbol: sentiment_result} dict.
    """
    tasks = []
    symbols = []
    for item in symbols_with_names:
        sym = item.get("symbol", "")
        name = item.get("name", sym)
        if sym:
            symbols.append(sym)
            tasks.append(get_sentiment(sym, name))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    batch_result = {}
    for sym, result in zip(symbols, results):
        if isinstance(result, Exception):
            print(f"Batch sentiment error for {sym}: {result}")
            batch_result[sym] = {**NEUTRAL_RESULT}
        else:
            batch_result[sym] = result

    return batch_result
