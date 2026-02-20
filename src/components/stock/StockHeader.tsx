'use client';

import { PriceChange } from '@/components/shared/PriceChange';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencySelector } from '@/components/shared/CurrencySelector';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import { useCurrency } from '@/hooks/useCurrency';
import { StockQuote } from '@/types/stock';

interface StockHeaderProps {
  quote: StockQuote;
}

export function StockHeader({ quote }: StockHeaderProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(quote.symbol);
  const { selectedCurrency } = useCurrencyContext();
  const { data: conversionData } = useCurrency(quote.currency, selectedCurrency, 1);

  // Get conversion rate, default to 1 if loading or error
  const conversionRate = conversionData?.rate || 1;
  const displayCurrency = selectedCurrency;

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(quote.symbol);
    } else {
      addToWatchlist({
        symbol: quote.symbol,
        name: quote.name,
        type: 'stock',
      });
    }
  };

  return (
    <div className="glass-card p-6 relative z-30">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {quote.logo && (
              <img
                src={quote.logo}
                alt={quote.name}
                className="w-12 h-12 p-1.5 rounded-full ring-2 ring-white/20 dark:ring-white/10 bg-white dark:bg-neutral-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <h1 className="text-3xl font-bold">{quote.name}</h1>
            {quote.preMarket && (
              <Badge variant="outline" className="text-xs">
                Pre-market: {displayCurrency === 'USD' ? '$' : ''}{(quote.preMarket * conversionRate).toFixed(2)}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-lg">{quote.symbol}</span>
            <span>·</span>
            <span>{quote.exchange}</span>
            <span>·</span>
            <span>{displayCurrency}</span>
          </div>

          <div className="mt-4">
            <PriceChange
              price={quote.price * conversionRate}
              change={quote.change * conversionRate}
              changePercent={quote.changePercent}
              currency={displayCurrency}
              size="lg"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <CurrencySelector />
          <Button
            variant={inWatchlist ? 'default' : 'glass'}
            onClick={toggleWatchlist}
            className="gap-2"
          >
            {inWatchlist ? (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                Added
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Add to Watchlist
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
