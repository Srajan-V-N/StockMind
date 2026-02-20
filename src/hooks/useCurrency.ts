'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

interface CurrencyConversion {
  rate: number;
  converted: number;
}

export function useCurrency(
  from: string,
  to: string,
  amount: number = 1
) {
  const [data, setData] = useState<CurrencyConversion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!from || !to || from === to) {
      setData({ rate: 1, converted: amount });
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiGet<CurrencyConversion>(
          API_ENDPOINTS.fx,
          { from, to, amount: amount.toString() }
        );
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch currency data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [from, to, amount]);

  return { data, loading, error };
}
