'use client';

import { useState, useEffect } from 'react';
import { ChartDataPoint, TimeRange } from '@/types/chart';
import { apiGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { convertToChartData } from '@/lib/chartUtils';

export function useHistoricalData(
  symbol: string | null,
  type: 'stock' | 'crypto',
  timeRange: TimeRange = '1M'
) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const endpoint = type === 'stock'
          ? API_ENDPOINTS.stocks.historical
          : API_ENDPOINTS.crypto.historical;

        const params: Record<string, string> = type === 'stock'
          ? { symbol, range: timeRange }
          : { id: symbol, range: timeRange };

        const result = await apiGet<any>(endpoint, params);
        // Pass explicit value key for crypto ('value'), let stocks auto-detect ('close')
        const valueKey = type === 'crypto' ? 'value' : undefined;
        const chartData = convertToChartData(result.data || result, valueKey);
        setData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, type, timeRange]);

  return { data, loading, error };
}
