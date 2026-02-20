'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UnifiedChart } from '@/components/charts/UnifiedChart';
import { SearchBar } from '@/components/shared/SearchBar';
import { TimeRange } from '@/types/chart';
import { ChartSeries } from '@/types/chart';
import { normalizeToPercentChange } from '@/lib/chartUtils';

interface ComparedAsset {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  data: any[];
  color: string;
  price: number;
  change: number;
  changePercent: number;
}

interface ComparisonModeProps {
  baseAsset: {
    symbol: string;
    name: string;
    type: 'stock' | 'crypto';
    data: any[];
  };
}

const COMPARISON_COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'];

export function ComparisonMode({ baseAsset }: ComparisonModeProps) {
  const chartDataArr = (baseAsset.data as any).data || baseAsset.data || [];
  
  const [comparedAssets, setComparedAssets] = useState<ComparedAsset[]>([
    {
      symbol: baseAsset.symbol,
      name: baseAsset.name,
      type: baseAsset.type,
      data: normalizeToPercentChange(chartDataArr),
      color: COMPARISON_COLORS[0],
      price: chartDataArr[chartDataArr.length - 1]?.value || 0,
      change: (chartDataArr[chartDataArr.length - 1]?.value || 0) - (chartDataArr[0]?.value || 0),
      changePercent: chartDataArr[0]?.value ? (((chartDataArr[chartDataArr.length - 1]?.value - chartDataArr[0]?.value) / chartDataArr[0]?.value) * 100) : 0,
    },
  ]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [showSearch, setShowSearch] = useState(false);

  const addAssetToComparison = async (symbol: string, name: string, type: 'stock' | 'crypto') => {
    if (comparedAssets.length >= 5) {
      alert('Maximum 5 assets can be compared at once');
      return;
    }

    if (comparedAssets.some((a) => a.symbol === symbol)) {
      alert('Asset already added to comparison');
      return;
    }

    try {
      const endpoint = type === 'stock' ? '/api/stocks/historical' : '/api/crypto/historical';
      const params: Record<string, string> = type === 'stock' ? { symbol, range: timeRange } : { id: symbol, range: timeRange };
      const queryString = new URLSearchParams(params).toString();

      const response = await fetch(`${endpoint}?${queryString}`);
      const result = await response.json();

      if (result.error) {
        alert('Failed to fetch data for comparison');
        return;
      }

      const chartDataArr = result.data || result;
      const normalizedData = normalizeToPercentChange(chartDataArr);
      const lastPoint = chartDataArr[chartDataArr.length - 1] || {};
      const firstPoint = chartDataArr[0] || {};
      const change = (lastPoint.value || 0) - (firstPoint.value || 0);
      const changePercent = (firstPoint.value !== 0) ? ((change / firstPoint.value) * 100) : 0;

      setComparedAssets((prev) => [
        ...prev,
        {
          symbol,
          name,
          type,
          data: normalizedData,
          color: COMPARISON_COLORS[prev.length % COMPARISON_COLORS.length],
          price: lastPoint.value || 0,
          change,
          changePercent,
        },
      ]);
      setShowSearch(false);
    } catch (error) {
      console.error('Error adding asset to comparison:', error);
      alert('Failed to add asset to comparison');
    }
  };

  const removeAssetFromComparison = (symbol: string) => {
    if (comparedAssets.length === 1) {
      alert('At least one asset must remain in comparison');
      return;
    }
    setComparedAssets((prev) => prev.filter((a) => a.symbol !== symbol));
  };

  const handleTimeRangeChange = async (newRange: TimeRange) => {
    setTimeRange(newRange);

    // Refetch all assets with new time range
    const updatedAssets = await Promise.all(
      comparedAssets.map(async (asset) => {
        try {
          const endpoint = asset.type === 'stock' ? '/api/stocks/historical' : '/api/crypto/historical';
          const params: Record<string, string> = asset.type === 'stock' ? { symbol: asset.symbol, range: newRange } : { id: asset.symbol, range: newRange };
          const queryString = new URLSearchParams(params).toString();

          const response = await fetch(`${endpoint}?${queryString}`);
          const result = await response.json();

          if (result.error) return asset;

          const chartDataArr = result.data || result;
          const normalizedData = normalizeToPercentChange(chartDataArr);
          const lastPoint = chartDataArr[chartDataArr.length - 1] || {};
          const firstPoint = chartDataArr[0] || {};
          const change = (lastPoint.value || 0) - (firstPoint.value || 0);
          const changePercent = (firstPoint.value !== 0) ? ((change / firstPoint.value) * 100) : 0;

          return {
            ...asset,
            data: normalizedData,
            price: lastPoint.value || 0,
            change,
            changePercent,
          };
        } catch (error) {
          console.error('Error refetching data:', error);
          return asset;
        }
      })
    );

    setComparedAssets(updatedAssets);
  };

  // Memoize series to prevent recreation on every render
  const series: ChartSeries[] = useMemo(
    () => comparedAssets.map((asset) => ({
      name: asset.name,
      data: asset.data,
      color: asset.color,
    })),
    [comparedAssets]
  );

  // Memoize colors array to prevent recreation on every render
  const colors = useMemo(
    () => comparedAssets.map((a) => a.color),
    [comparedAssets]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Comparison Mode</CardTitle>
            <Button variant="glass" onClick={() => setShowSearch(!showSearch)}>
              {showSearch ? 'Cancel' : 'Add Asset'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showSearch && (
            <div className="mb-6">
              <SearchBar
                onSelectAsset={(symbol, name, type) => addAssetToComparison(symbol, name, type)}
                placeholder="Search stocks or crypto to compare..."
              />
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing % change from first data point
            </p>
          </div>

          <UnifiedChart
            data={comparedAssets[0]?.data || []}
            type="comparison"
            multiLine={true}
            series={series}
            colors={colors}
            height={400}
            timeRange={timeRange}
            showTimeToggle={true}
            onTimeRangeChange={handleTimeRangeChange}
            enableTooltip={true}
          />

          <div className="mt-6 space-y-3">
            {comparedAssets.map((asset) => (
              <div
                key={asset.symbol}
                className="flex items-center justify-between p-4 glass-card"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: asset.color }}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{asset.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{asset.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${asset.price.toFixed(2)}</div>
                    <div
                      className={`text-sm ${
                        asset.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {asset.changePercent >= 0 ? '+' : ''}
                      {asset.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
                {comparedAssets.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAssetFromComparison(asset.symbol)}
                    className="ml-4 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
