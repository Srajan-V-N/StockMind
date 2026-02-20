'use client';

import { useState, useEffect } from 'react';
import { CryptoPrice } from '@/types/crypto';
import { apiGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

export function useCryptoData(id: string | null) {
  const [data, setData] = useState<CryptoPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiGet<CryptoPrice>(API_ENDPOINTS.crypto.price, { id });
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch crypto data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
}
