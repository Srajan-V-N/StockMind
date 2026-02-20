'use client';

import { useEffect, useRef, useMemo, memo } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts';
import { UnifiedChartProps } from '@/types/chart';
import { useTheme } from '@/contexts/ThemeContext';
import { TimeRangeToggle } from './TimeRangeToggle';

// Move default colors outside component to prevent recreation
const DEFAULT_COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'];

export const UnifiedChart = memo(function UnifiedChart({
  data,
  type,
  showPreviousClose = false,
  previousClose,
  height = 400,
  timeRange = '1M',
  showTimeToggle = false,
  onTimeRangeChange,
  multiLine = false,
  series = [],
  colors = DEFAULT_COLORS,
  enableTooltip = true,
  currency = 'USD',
  loading = false,
}: UnifiedChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<any>[]>([]);
  const { theme } = useTheme();

  // Memoize data transformations to prevent unnecessary recalculations
  const transformedData = useMemo(() => {
    if (multiLine && series.length > 0) {
      return series.map(s => ({
        ...s,
        data: s.data.map(d => ({
          time: (typeof d.time === 'string' ? new Date(d.time).getTime() / 1000 : d.time) as any,
          value: d.value,
        }))
      }));
    }
    if (data && data.length > 0) {
      return data.map(d => ({
        time: (typeof d.time === 'string' ? new Date(d.time).getTime() / 1000 : d.time) as any,
        value: d.value,
      }));
    }
    return [];
  }, [data, series, multiLine]);

  useEffect(() => {
    if (!chartContainerRef.current || loading) return;

    // Premium theme colors using new design system
    const isDark = theme === 'dark';
    const backgroundColor = 'transparent';
    const textColor = isDark ? '#A3A3A3' : '#737373'; // neutral-400 / neutral-500
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const crosshairColor = isDark ? '#525252' : '#D4D4D4'; // neutral-600 / neutral-300

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
      grid: {
        vertLines: {
          color: gridColor,
          style: 1,
        },
        horzLines: {
          color: gridColor,
          style: 1,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: crosshairColor,
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#404040' : '#D4D4D4',
        },
        horzLine: {
          color: crosshairColor,
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#404040' : '#D4D4D4',
        },
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Clear previous series
    seriesRefs.current = [];

    if (multiLine && (transformedData as any[]).length > 0 && Array.isArray((transformedData as any[])[0]?.data)) {
      // Multi-line chart for comparison mode (transformedData is series array)
      (transformedData as any[]).forEach((s, index) => {
        const lineSeries = chart.addLineSeries({
          color: colors[index % colors.length],
          lineWidth: 2,
          title: s.name,
        });

        lineSeries.setData(s.data);
        seriesRefs.current.push(lineSeries);
      });
    } else if (transformedData.length > 0) {
      // Single area chart with premium brand colors (transformedData is data array)
      const areaSeries = chart.addAreaSeries({
        topColor: isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.25)', // brand-500
        bottomColor: isDark ? 'rgba(59, 130, 246, 0.0)' : 'rgba(59, 130, 246, 0.02)',
        lineColor: isDark ? '#60A5FA' : '#3B82F6', // brand-400 / brand-500
        lineWidth: 2,
      });

      areaSeries.setData(transformedData as any);
      seriesRefs.current.push(areaSeries);

      // Add previous close reference line with premium styling
      if (showPreviousClose && previousClose) {
        areaSeries.createPriceLine({
          price: previousClose,
          color: isDark ? '#737373' : '#A3A3A3', // neutral-500 / neutral-400
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'Prev Close',
        });
      }
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle responsive resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
    };
  }, [transformedData, multiLine, height, theme, showPreviousClose, previousClose, colors]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center glass-card-premium rounded-xl relative"
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-xl">
          <div className="w-12 h-12 border-4 border-brand-200 dark:border-brand-900 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Handle empty data for both single-line and multi-line modes
  const hasNoData = multiLine
    ? (!series || series.length === 0)
    : (!data || data.length === 0);

  if (hasNoData) {
    return (
      <div
        className="flex items-center justify-center glass-card-premium rounded-xl"
        style={{ height }}
      >
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">No chart data available</p>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      {showTimeToggle && onTimeRangeChange && (
        <TimeRangeToggle
          selected={timeRange}
          onChange={onTimeRangeChange}
        />
      )}
      <div
        ref={chartContainerRef}
        className="rounded-xl overflow-hidden"
      />
    </div>
  );
});
