'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PriceChange } from '@/components/shared/PriceChange';
import { UnifiedChart } from '@/components/charts/UnifiedChart';
import { useRouter } from 'next/navigation';
import { Competitor } from '@/types/stock';
import { useState } from 'react';
import { TimeRange } from '@/types/chart';

interface TopCompetitorsProps {
  competitors: (Competitor & { chartData?: any[] })[];
}

export function TopCompetitors({ competitors }: TopCompetitorsProps) {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  if (!competitors || competitors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Competitors (by Market Cap)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Top competitors unavailable</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later for updates</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Competitors (by Market Cap)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {competitors.map((competitor, index) => (
            <button
              key={competitor.symbol}
              onClick={() => router.push(`/stocks/${competitor.symbol}`)}
              className="glass-card p-4 hover:bg-white/15 dark:hover:bg-black/25 transition-all text-left rounded-xl"
            >
              <div className="mb-3">
                <div className="flex items-start gap-3 mb-1">
                  {competitor.logo && (
                    <img
                      src={competitor.logo}
                      alt={competitor.name}
                      className="w-10 h-10 p-1 rounded-full ring-2 ring-white/20 dark:ring-white/10 bg-white dark:bg-neutral-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{competitor.name}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">#{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{competitor.symbol}</p>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <PriceChange
                  price={competitor.price}
                  change={competitor.change}
                  changePercent={competitor.changePercent}
                  size="sm"
                />
              </div>

              {competitor.chartData && competitor.chartData.length > 0 && (
                <div className="mt-3">
                  <UnifiedChart
                    data={competitor.chartData}
                    type="stock"
                    height={120}
                    timeRange={timeRange}
                    showTimeToggle={false}
                  />
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-white/10 dark:border-white/5">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span>Market Cap: </span>
                  <span className="font-medium">
                    {competitor.marketCap >= 1e12
                      ? `$${(competitor.marketCap / 1e12).toFixed(2)}T`
                      : competitor.marketCap >= 1e9
                      ? `$${(competitor.marketCap / 1e9).toFixed(2)}B`
                      : `$${(competitor.marketCap / 1e6).toFixed(2)}M`}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
