'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/constants';

export interface DivergenceData {
  symbol: string;
  signal: 'caution_zone' | 'recovery_watch' | 'strong_trend' | 'weak_trend' | 'neutral';
  label: string;
  description: string;
  price_change_30d_pct: number;
  sentiment_mood: string;
  positive_pct: number;
  negative_pct: number;
  educational_only: boolean;
}

export function useDivergence(symbol: string | undefined, name?: string) {
  const [divergence, setDivergence] = useState<DivergenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchDivergence = async () => {
      try {
        const params = new URLSearchParams({ symbol });
        if (name) params.set('name', name);

        const response = await fetch(`${API_ENDPOINTS.sentiment.divergence}?${params}`);
        const data = await response.json();

        if (!cancelled) {
          setDivergence(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to fetch divergence');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDivergence();

    return () => {
      cancelled = true;
    };
  }, [symbol, name]);

  return { divergence, loading, error };
}
