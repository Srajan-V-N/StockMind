export interface ChartDataPoint {
  time: string | number;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export type TimeRange = '1D' | '5D' | '1M' | '6M' | '1Y' | 'MAX';

export interface UnifiedChartProps {
  data: ChartDataPoint[];
  type: 'stock' | 'crypto' | 'comparison' | 'performance';
  showPreviousClose?: boolean;
  previousClose?: number;
  height?: number;
  timeRange?: TimeRange;
  showTimeToggle?: boolean;
  onTimeRangeChange?: (range: TimeRange) => void;
  multiLine?: boolean;
  series?: ChartSeries[];
  colors?: string[];
  enableTooltip?: boolean;
  currency?: string;
  loading?: boolean;
}
