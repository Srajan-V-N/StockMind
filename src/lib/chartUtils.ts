import { ChartDataPoint, TimeRange } from '@/types/chart';
import { format, subDays, subMonths, subYears, parseISO } from 'date-fns';

// Convert data to chart format
export function convertToChartData(
  data: any[],
  valueKey?: string,
  timeKey: string = 'time'
): ChartDataPoint[] {
  // Return empty array if data is invalid
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  // Auto-detect value key if not provided
  const firstItem = data[0];
  const detectedValueKey = valueKey ||
    (firstItem.value !== undefined ? 'value' :
     firstItem.close !== undefined ? 'close' :
     'value');

  return data.map(item => ({
    time: item[timeKey],
    value: Number(item[detectedValueKey]) || 0,
    open: item.open ? Number(item.open) : undefined,
    high: item.high ? Number(item.high) : undefined,
    low: item.low ? Number(item.low) : undefined,
    close: item.close ? Number(item.close) : undefined,
  }));
}

// Normalize data to percentage change
export function normalizeToPercentChange(data: ChartDataPoint[]): ChartDataPoint[] {
  if (!data || data.length === 0) return [];

  const firstValue = data[0]?.value;
  if (firstValue === undefined || firstValue === 0) return data;

  return data.map(point => ({
    ...point,
    value: ((point.value - firstValue) / firstValue) * 100,
  }));
}

// Filter data by time range
export function filterDataByTimeRange(
  data: ChartDataPoint[],
  timeRange: TimeRange
): ChartDataPoint[] {
  if (timeRange === 'MAX') return data;

  const now = new Date();
  let cutoffDate: Date;

  switch (timeRange) {
    case '1D':
      cutoffDate = subDays(now, 1);
      break;
    case '5D':
      cutoffDate = subDays(now, 5);
      break;
    case '1M':
      cutoffDate = subMonths(now, 1);
      break;
    case '6M':
      cutoffDate = subMonths(now, 6);
      break;
    case '1Y':
      cutoffDate = subYears(now, 1);
      break;
    default:
      return data;
  }

  return data.filter(point => {
    const pointDate = typeof point.time === 'string'
      ? parseISO(point.time)
      : new Date(point.time * 1000);
    return pointDate >= cutoffDate;
  });
}

// Get time range in days
export function getTimeRangeInDays(timeRange: TimeRange): number {
  switch (timeRange) {
    case '1D': return 1;
    case '5D': return 5;
    case '1M': return 30;
    case '6M': return 180;
    case '1Y': return 365;
    case 'MAX': return 365 * 10; // 10 years
    default: return 30;
  }
}

// Format time for chart tooltip
export function formatChartTime(time: string | number, timeRange: TimeRange): string {
  const date = typeof time === 'string' ? parseISO(time) : new Date(time * 1000);

  if (timeRange === '1D' || timeRange === '5D') {
    return format(date, 'HH:mm');
  } else if (timeRange === '1M') {
    return format(date, 'MMM dd');
  } else {
    return format(date, 'MMM dd, yyyy');
  }
}

// Calculate chart statistics
export function calculateChartStats(data: ChartDataPoint[]) {
  if (data.length === 0) {
    return { min: 0, max: 0, avg: 0, change: 0, changePercent: 0 };
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  const change = lastValue - firstValue;
  const changePercent = (change / firstValue) * 100;

  return { min, max, avg, change, changePercent };
}

// Downsample data for performance
export function downsampleData(
  data: ChartDataPoint[],
  maxPoints: number = 1000
): ChartDataPoint[] {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}
