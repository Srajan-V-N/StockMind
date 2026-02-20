'use client';

import { useMarket } from '@/contexts/MarketContext';
import { MARKETS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function TopMarketsNav() {
  const { selectedMarket, setSelectedMarket } = useMarket();

  return (
    <div className="border-b border-white/10 dark:border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
          {MARKETS.map((market) => (
            <button
              key={market.value}
              onClick={() => setSelectedMarket(market.value)}
              suppressHydrationWarning
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
                selectedMarket === market.value
                  ? 'bg-white/10 dark:bg-white/15 text-brand-500 dark:text-brand-400 border border-brand-500/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/5'
              )}
            >
              {market.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
