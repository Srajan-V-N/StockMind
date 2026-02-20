import { NextRequest, NextResponse } from 'next/server';
import { isFinancialNews } from '@/lib/validators';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Domain mapping for different categories
const DOMAIN_MAPPING: Record<string, Record<string, string>> = {
  top: {
    all: 'reuters.com,bloomberg.com,cnbc.com,wsj.com,ft.com,marketwatch.com',
  },
  local: {
    us: 'cnbc.com,marketwatch.com,wsj.com,bloomberg.com',
    india: 'economictimes.indiatimes.com,moneycontrol.com,business-standard.com',
    europe: 'ft.com,reuters.com,bloomberg.com',
    asia: 'nikkei.com,reuters.com,bloomberg.com',
    uk: 'ft.com,reuters.com,telegraph.co.uk',
  },
  world: {
    all: 'reuters.com,bloomberg.com,ft.com,wsj.com,cnbc.com',
  },
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || 'top';
    const market = searchParams.get('market') || 'us';
    const userQuery = searchParams.get('query') || '';

    // Build query and domains based on category
    let query = userQuery
      ? `${userQuery} AND (stock OR market OR finance OR economy)`
      : 'stock OR market OR finance OR economy OR trading';
    let domains = DOMAIN_MAPPING.top.all; // Default

    if (category === 'top') {
      domains = DOMAIN_MAPPING.top.all;
    } else if (category === 'local') {
      const marketKey = market.toLowerCase();
      domains = DOMAIN_MAPPING.local[marketKey] || DOMAIN_MAPPING.local.us;
      query += ` AND ${market}`;
    } else if (category === 'world') {
      domains = DOMAIN_MAPPING.world.all;
      query += ' AND (global OR international OR world)';
    }

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&domains=${domains}&language=en&sortBy=publishedAt&pageSize=50&apiKey=${NEWS_API_KEY}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    const articles = data.articles || [];

    // Filter for financial content only when browsing (no user query)
    // When a user searches, the API query already constrains to financial context
    const filteredArticles = userQuery
      ? articles
      : articles.filter((article: any) =>
          isFinancialNews(article.title || '', article.description || '')
        );

    return NextResponse.json({ articles: filteredArticles });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
