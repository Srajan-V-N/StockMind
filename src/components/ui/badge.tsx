import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-brand-500/10 text-brand-500': variant === 'default',
          'bg-success/10 text-success': variant === 'success',
          'bg-error/10 text-error': variant === 'error',
          'border border-white/20 dark:border-white/10': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
