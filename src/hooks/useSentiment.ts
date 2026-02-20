'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ClassifiedArticle } from '@/types/news';

export interface SentimentData {
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
  mixed_pct: number;
  mood: 'positive' | 'neutral' | 'negative' | 'mixed';
  summary: string;
  article_count: number;
  classified_articles: ClassifiedArticle[];
  fetched_at?: string;
}

export function useSentiment(symbol: string | undefined, name?: string) {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchSentiment = async () => {
      try {
        const params = new URLSearchParams({ symbol });
        if (name) params.set('name', name);

        const response = await fetch(`${API_ENDPOINTS.sentiment.get}?${params}`);
        const data = await response.json();

        if (!cancelled) {
          setSentiment(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to fetch sentiment');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSentiment();

    return () => {
      cancelled = true;
    };
  }, [symbol, name]);

  return { sentiment, loading, error };
}
