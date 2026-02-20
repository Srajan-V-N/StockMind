'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AssetCard } from '@/components/shared/AssetCard';
import { apiGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { useMarket } from '@/contexts/MarketContext';

export function MarketTrends() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { selectedMarket } = useMarket();

  useEffect(() => {
    // Reset state when market changes
    setLoading(true);
    setData(null);

    const fetchData = async () => {
      try {
        const result = await apiGet(API_ENDPOINTS.stocks.summary, { market: selectedMarket });
        setData(result);
      } catch (error) {
        // Don't log AbortErrors as they are expected during cleanup/unmount
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch market trends:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMarket]);

  if (loading) {
    return (
      <div>
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-8">
          Market Trends
        </h2>
        <div className="skeleton h-64 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight mb-8">
        Market Trends
      </h2>
      <Tabs defaultValue="active">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="active">Most Active</TabsTrigger>
          <TabsTrigger value="gainers">Gainers</TabsTrigger>
          <TabsTrigger value="losers">Losers</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {data?.mostActive?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-fade-in">
              {data.mostActive.map((asset: any) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No market data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later for updates</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gainers">
          {data?.gainers?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-fade-in">
              {data.gainers.map((asset: any) => (
                <AssetCard
                  key={asset.symbol}
                  symbol={asset.symbol}
                  name={asset.name}
                  price={asset.price}
                  change={asset.change}
                  changePercent={asset.changePercent}
                  type="stock"
                  image={asset.logo}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No gainers data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later for updates</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="losers">
          {data?.losers?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-fade-in">
              {data.losers.map((asset: any) => (
                <AssetCard
                  key={asset.symbol}
                  symbol={asset.symbol}
                  name={asset.name}
                  price={asset.price}
                  change={asset.change}
                  changePercent={asset.changePercent}
                  type="stock"
                  image={asset.logo}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No losers data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later for updates</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
