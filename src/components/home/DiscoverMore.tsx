'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AssetCard } from '@/components/shared/AssetCard';
import { apiGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

export function DiscoverMore() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch a mix of stocks and crypto
        const [stocksData, cryptoData] = await Promise.all([
          apiGet(API_ENDPOINTS.stocks.summary, { market: 'global' }).catch(() => ({ indices: [], mostActive: [] })),
          apiGet<any[]>(API_ENDPOINTS.crypto.search, { q: 'bitcoin' }).catch(() => []),
        ]);

        const stocksResponse = stocksData as any;
        const mixed = [
          ...(stocksResponse.indices || []).slice(0, 3),
          ...(stocksResponse.mostActive || []).slice(0, 3),
          ...cryptoData.slice(0, 3).map((c: any) => ({ ...c, type: 'crypto' })),
        ];

        setAssets(mixed);
      } catch (error) {
        console.error('Failed to fetch discover assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-8">
          Discover More
        </h2>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-48 w-80 shrink-0 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-8">
        Discover More
      </h2>
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
        {assets.map((asset, index) => (
          <div key={`${asset.symbol}-${index}`} className="w-80 shrink-0">
            <AssetCard
              symbol={asset.symbol || asset.id}
              name={asset.name}
              price={asset.price}
              change={asset.change || asset.change24h || 0}
              changePercent={asset.changePercent || asset.changePercent24h || 0}
              type={asset.type || 'stock'}
              image={asset.logo || asset.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
