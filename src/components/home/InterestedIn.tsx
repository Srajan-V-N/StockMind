'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AssetCard } from '@/components/shared/AssetCard';
import { apiGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useMarket } from '@/contexts/MarketContext';

export function InterestedIn() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentiments, setSentiments] = useState<Record<string, string>>({});
  const { selectedMarket } = useMarket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiGet(API_ENDPOINTS.stocks.summary, {
          market: selectedMarket,
        });
        const response = data as any;
        // Mix of indices and trending stocks
        const topAssets = [
          ...(response.indices || []).slice(0, 2),
          ...(response.mostActive || []).slice(0, 4),
        ];
        setAssets(topAssets);

        // Fetch sentiment in background for non-index assets
        const stockAssets = topAssets.filter((a: any) => !a.symbol?.startsWith('^'));
        if (stockAssets.length > 0) {
          fetchSentiments(stockAssets);
        }
      } catch (error) {
        console.error('Failed to fetch interested assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMarket]);

  const fetchSentiments = async (stockAssets: any[]) => {
    try {
      const symbols = stockAssets.map((a: any) => ({ symbol: a.symbol, name: a.name }));
      const resp = await fetch(API_ENDPOINTS.sentiment.batch, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });
      const data = await resp.json();
      const moods: Record<string, string> = {};
      for (const [sym, val] of Object.entries(data.sentiments || {})) {
        moods[sym] = (val as any).mood || 'neutral';
      }
      setSentiments(moods);
    } catch {
      // Sentiment is non-blocking, ignore errors
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-8">
          You May Be Interested In
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-48 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-8">
        You May Be Interested In
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assets.map((asset) => (
          <AssetCard
            key={asset.symbol}
            symbol={asset.symbol}
            name={asset.name}
            price={asset.price}
            change={asset.change}
            changePercent={asset.changePercent}
            type="stock"
            volume={asset.volume}
            image={asset.logo}
            sentimentMood={sentiments[asset.symbol]}
          />
        ))}
      </div>
    </div>
  );
}
