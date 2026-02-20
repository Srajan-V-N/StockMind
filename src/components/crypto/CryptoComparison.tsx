'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UnifiedChart } from '@/components/charts/UnifiedChart';
import { SearchBar } from '@/components/shared/SearchBar';
import { TimeRange } from '@/types/chart';
import { ChartSeries } from '@/types/chart';

interface ComparedCrypto {
  id: string;
  name: string;
  symbol: string;
  data: any[];
  color: string;
  price: number;
  change: number;
  changePercent: number;
}

interface CryptoComparisonProps {
  baseCrypto: {
    id: string;
    name: string;
    symbol: string;
    data: any[];
  };
}

const COMPARISON_COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336'];

export function CryptoComparison({ baseCrypto }: CryptoComparisonProps) {
  const [comparedCryptos, setComparedCryptos] = useState<ComparedCrypto[]>([
    {
      id: baseCrypto.id,
      name: baseCrypto.name,
      symbol: baseCrypto.symbol,
      data: normalizeData(baseCrypto.data),
      color: COMPARISON_COLORS[0],
      price: baseCrypto.data[baseCrypto.data.length - 1]?.value || 0,
      change: 0,
      changePercent: 0,
    },
  ]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [showSearch, setShowSearch] = useState(false);

  function normalizeData(data: any[]) {
    if (!data || data.length === 0) return [];
    const firstValue = data[0].value;
    return data.map((point) => ({
      ...point,
      value: ((point.value - firstValue) / firstValue) * 100,
    }));
  }

  const addCryptoToComparison = async (id: string, name: string) => {
    if (comparedCryptos.length >= 5) {
      alert('Maximum 5 cryptocurrencies can be compared at once');
      return;
    }

    if (comparedCryptos.some((c) => c.id === id)) {
      alert('Cryptocurrency already added to comparison');
      return;
    }

    try {
      const response = await fetch(`/api/crypto/historical?id=${id}&range=${timeRange}`);
      const data = await response.json();

      if (data.error) {
        alert('Failed to fetch data for comparison');
        return;
      }

      const normalizedData = normalizeData(data);
      const lastPoint = data[data.length - 1] || {};
      const firstPoint = data[0] || {};
      const change = lastPoint.value - firstPoint.value;
      const changePercent = ((change / firstPoint.value) * 100) || 0;

      // Get crypto details for symbol
      const detailsResponse = await fetch(`/api/crypto/price?id=${id}`);
      const details = await detailsResponse.json();

      setComparedCryptos((prev) => [
        ...prev,
        {
          id,
          name,
          symbol: details.symbol || id,
          data: normalizedData,
          color: COMPARISON_COLORS[prev.length % COMPARISON_COLORS.length],
          price: lastPoint.value || 0,
          change,
          changePercent,
        },
      ]);
      setShowSearch(false);
    } catch (error) {
      console.error('Error adding crypto to comparison:', error);
      alert('Failed to add cryptocurrency to comparison');
    }
  };

  const removeCryptoFromComparison = (id: string) => {
    if (comparedCryptos.length === 1) {
      alert('At least one cryptocurrency must remain in comparison');
      return;
    }
    setComparedCryptos((prev) => prev.filter((c) => c.id !== id));
  };

  const handleTimeRangeChange = async (newRange: TimeRange) => {
    setTimeRange(newRange);

    // Refetch all cryptos with new time range
    const updatedCryptos = await Promise.all(
      comparedCryptos.map(async (crypto) => {
        try {
          const response = await fetch(`/api/crypto/historical?id=${crypto.id}&range=${newRange}`);
          const data = await response.json();

          if (data.error) return crypto;

          const normalizedData = normalizeData(data);
          const lastPoint = data[data.length - 1] || {};
          const firstPoint = data[0] || {};
          const change = lastPoint.value - firstPoint.value;
          const changePercent = ((change / firstPoint.value) * 100) || 0;

          return {
            ...crypto,
            data: normalizedData,
            price: lastPoint.value || 0,
            change,
            changePercent,
          };
        } catch (error) {
          console.error('Error refetching data:', error);
          return crypto;
        }
      })
    );

    setComparedCryptos(updatedCryptos);
  };

  const series: ChartSeries[] = comparedCryptos.map((crypto) => ({
    name: crypto.name,
    data: crypto.data,
    color: crypto.color,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Comparison Mode</CardTitle>
            <Button variant="glass" onClick={() => setShowSearch(!showSearch)}>
              {showSearch ? 'Cancel' : 'Add Crypto'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showSearch && (
            <div className="mb-6">
              <SearchBar
                onSelectAsset={(id, name, type) => {
                  if (type === 'crypto') {
                    addCryptoToComparison(id, name);
                  }
                }}
                placeholder="Search cryptocurrencies to compare..."
              />
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing % change from first data point
            </p>
          </div>

          <UnifiedChart
            data={[]}
            type="comparison"
            multiLine={true}
            series={series}
            colors={comparedCryptos.map((c) => c.color)}
            height={400}
            timeRange={timeRange}
            showTimeToggle={true}
            onTimeRangeChange={handleTimeRangeChange}
            enableTooltip={true}
          />

          <div className="mt-6 space-y-3">
            {comparedCryptos.map((crypto) => (
              <div
                key={crypto.id}
                className="flex items-center justify-between p-4 glass-card"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: crypto.color }}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{crypto.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 uppercase">
                      {crypto.symbol}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${crypto.price.toFixed(2)}</div>
                    <div
                      className={`text-sm ${
                        crypto.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {crypto.changePercent >= 0 ? '+' : ''}
                      {crypto.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
                {comparedCryptos.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCryptoFromComparison(crypto.id)}
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
