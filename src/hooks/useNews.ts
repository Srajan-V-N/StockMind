'use client';

import { useState, useEffect } from 'react';
import { NewsArticle, NewsCategory } from '@/types/news';
import { apiGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

export function useNews(category: NewsCategory = 'top', market: string = 'us') {
  const [data, setData] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiGet<{ articles: NewsArticle[] }>(
          API_ENDPOINTS.news,
          { category, market }
        );
        setData(result.articles || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch news');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, market]);

  return { data, loading, error, refetch: () => {} };
}
