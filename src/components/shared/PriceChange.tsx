'use client';

import { formatCurrency, formatPercent } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface PriceChangeProps {
  price: number | null | undefined;
  change: number | null | undefined;
  changePercent: number | null | undefined;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showArrow?: boolean;
  className?: string;
}

export function PriceChange({
  price,
  change,
  changePercent,
  currency = 'USD',
  size = 'md',
  showArrow = true,
  className,
}: PriceChangeProps) {
  // Handle null/undefined - data may be unavailable
  const hasValidChange = change != null && !isNaN(change);
  const isPositive = hasValidChange ? change >= 0 : true;

  // Semantic color classes for professional appearance
  // Use neutral color when data is unavailable
  const colorClass = !hasValidChange
    ? 'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
    : isPositive
      ? 'text-success-600 dark:text-success-500 bg-success-50 dark:bg-success-950/30 border-success-200 dark:border-success-900/50'
      : 'text-danger-600 dark:text-danger-500 bg-danger-50 dark:bg-danger-950/30 border-danger-200 dark:border-danger-900/50';

  const sizeClasses = {
    sm: {
      price: 'text-base',
      badge: 'text-xs px-2 py-0.5',
      arrow: 'w-3 h-3',
    },
    md: {
      price: 'text-2xl',
      badge: 'text-sm px-2.5 py-1',
      arrow: 'w-3.5 h-3.5',
    },
    lg: {
      price: 'text-4xl',
      badge: 'text-base px-3 py-1.5',
      arrow: 'w-4 h-4',
    },
  };

  return (
    <div className={cn('flex items-baseline gap-3', className)}>
      <span
        className={cn(
          'font-bold text-neutral-900 dark:text-white tracking-tight',
          sizeClasses[size].price
        )}
      >
        {formatCurrency(price, currency)}
      </span>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg font-semibold border transition-all duration-200',
          colorClass,
          sizeClasses[size].badge
        )}
      >
        {showArrow && hasValidChange && (
          <svg
            className={cn(
              'transition-transform flex-shrink-0',
              sizeClasses[size].arrow,
              !isPositive && 'rotate-180'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span className="whitespace-nowrap">
          {formatPercent(changePercent)}
        </span>
      </div>
    </div>
  );
}
