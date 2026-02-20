'use client';

import { useState, useEffect } from 'react';
import { CompetitorsData } from '@/types/stock';
import { apiGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

export function useCompetitors(symbol: string | null) {
  const [data, setData] = useState<CompetitorsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiGet<CompetitorsData>(
          API_ENDPOINTS.competitors,
          { symbol }
        );
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch competitors');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  return { data, loading, error };
}
