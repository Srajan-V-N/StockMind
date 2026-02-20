'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UnifiedChart } from '@/components/charts/UnifiedChart';
import { useTradingContext } from '@/contexts/TradingContext';
import { useState } from 'react';
import { TimeRange } from '@/types/chart';

export function PerformanceChart() {
  const { getPerformanceData } = useTradingContext();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  const performanceData = getPerformanceData();

  // Filter data based on time range
  const filterDataByRange = (data: any[], range: TimeRange) => {
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '1D':
        startDate.setDate(now.getDate() - 1);
        break;
      case '5D':
        startDate.setDate(now.getDate() - 5);
        break;
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'MAX':
        return data;
    }

    return data.filter((point) => new Date(point.time) >= startDate);
  };

  const filteredData = filterDataByRange(performanceData, timeRange);

  if (performanceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No performance data available yet. Start trading to see your portfolio performance!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="guided-performance-chart">
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <UnifiedChart
          data={filteredData}
          type="performance"
          height={300}
          timeRange={timeRange}
          showTimeToggle={true}
          onTimeRangeChange={(range) => setTimeRange(range as TimeRange)}
          enableTooltip={true}
          currency="USD"
        />
      </CardContent>
    </Card>
  );
}
