'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { MarketSummary } from '@/types/api';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useMarket } from '@/contexts/MarketContext';

export function MarketSnapshot() {
  const [data, setData] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { selectedMarket } = useMarket();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let abortController = new AbortController();

    // Reset loading state when market changes
    setLoading(true);
    setData(null);

    const fetchData = async () => {
      try {
        // Use selected market from context instead of hardcoded 'US'
        const result = await apiGet<MarketSummary>(API_ENDPOINTS.stocks.summary, { market: selectedMarket });
        setData(result);
      } catch (error) {
        // Silently fail if request was aborted (component unmounted)
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch market snapshot:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    const startPolling = () => {
      fetchData();
      interval = setInterval(fetchData, 60000);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    // Use Page Visibility API to pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start initial polling
    startPolling();

    return () => {
      stopPolling();
      abortController.abort();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedMarket]);  // Re-fetch when market selection changes

  if (loading || !data) {
    return (
      <div className="border-b border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/5">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-12 w-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Combine all assets with their types for proper routing
  const allAssets = [
    ...data.indices.map(item => ({ ...item, assetType: 'index' as const })),
    ...data.futures.map(item => ({ ...item, assetType: 'future' as const })),
  ];

  // Show empty state when no assets available
  if (allAssets.length === 0) {
    return (
      <div className="border-b border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/5">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-sm">Market data temporarily unavailable</span>
          </div>
        </div>
      </div>
    );
  }

  // Handle navigation based on asset type
  const handleAssetClick = (asset: typeof allAssets[0]) => {
    // For crypto market, route to crypto page
    if (selectedMarket === 'crypto' && asset.symbol) {
      // CoinGecko uses lowercase IDs like 'bitcoin', 'ethereum'
      const cryptoId = asset.symbol.toLowerCase();
      router.push(`/crypto/${cryptoId}`);
    } else {
      router.push(`/stocks/${asset.symbol}`);
    }
  };

  return (
    <div className="border-b border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/5">
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {allAssets.map((asset, index) => (
            <button
              key={asset.symbol}
              onClick={() => handleAssetClick(asset)}
              className="flex items-center gap-3 px-4 py-2 glass-button hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] rounded-lg whitespace-nowrap transition-all duration-200 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                  {asset.name}
                </div>
                <div className="font-semibold">{formatCurrency(asset.price, 'USD', 0)}</div>
              </div>
              <div className={cn('flex items-center gap-1 text-sm font-medium', getChangeColor(asset.changePercent))}>
                <svg
                  className={cn(
                    'w-3 h-3 transition-transform',
                    asset.changePercent < 0 && 'rotate-180'
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{formatPercent(asset.changePercent)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
