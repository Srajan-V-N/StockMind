import numeral from 'numeral';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Format currency - handles null/undefined gracefully
export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'USD',
  decimals: number = 2
): string {
  // Handle null/undefined/NaN - return placeholder for unavailable data
  if (value == null || isNaN(value)) {
    return '--';
  }

  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CNY: '¥',
  };

  const symbol = currencySymbols[currency] || currency;

  if (Math.abs(value) >= 1e12) {
    return `${symbol}${(value / 1e12).toFixed(decimals)}T`;
  } else if (Math.abs(value) >= 1e9) {
    return `${symbol}${(value / 1e9).toFixed(decimals)}B`;
  } else if (Math.abs(value) >= 1e6) {
    return `${symbol}${(value / 1e6).toFixed(decimals)}M`;
  } else if (Math.abs(value) >= 1e3) {
    return `${symbol}${(value / 1e3).toFixed(decimals)}K`;
  }

  return `${symbol}${value.toFixed(decimals)}`;
}

// Format number
export function formatNumber(value: number, decimals: number = 2): string {
  return numeral(value).format(`0,0.${'0'.repeat(decimals)}`);
}

// Format large number (compact)
export function formatCompactNumber(value: number): string {
  return numeral(value).format('0.0a').toUpperCase();
}

// Format percentage - handles null/undefined gracefully
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  // Handle null/undefined/NaN - return placeholder for unavailable data
  if (value == null || isNaN(value)) {
    return '--';
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// Format market cap
export function formatMarketCap(value: number, currency: string = 'USD'): string {
  return formatCurrency(value, currency, 2);
}

// Format volume
export function formatVolume(value: number): string {
  return formatCompactNumber(value);
}

// Format date
export function formatDate(date: string | Date, formatStr: string = 'PPp'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

// Format price change - handles null/undefined gracefully
export function formatPriceChange(
  change: number | null | undefined,
  changePercent: number | null | undefined,
  currency: string = 'USD'
): { change: string; percent: string; color: string } {
  // Handle null/undefined/NaN
  if (change == null || isNaN(change) || changePercent == null || isNaN(changePercent)) {
    return { change: '--', percent: '--', color: 'text-neutral-500' };
  }
  const changeStr = `${change >= 0 ? '+' : ''}${formatCurrency(change, currency)}`;
  const percentStr = formatPercent(changePercent);
  const color = change >= 0 ? 'text-success' : 'text-error';

  return { change: changeStr, percent: percentStr, color };
}

// Get color for change - handles null/undefined gracefully
export function getChangeColor(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return 'text-neutral-500';
  }
  return value >= 0 ? 'text-success' : 'text-error';
}

// Get background color for change - handles null/undefined gracefully
export function getChangeBgColor(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return 'bg-neutral-100 dark:bg-neutral-800';
  }
  return value >= 0
    ? 'bg-success/10 dark:bg-success/20'
    : 'bg-error/10 dark:bg-error/20';
}
