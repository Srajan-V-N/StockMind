'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PriceChange } from './PriceChange';
import { SentimentDot } from '@/components/stock/SentimentPanel';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { useRouter } from 'next/navigation';

interface AssetCardProps {
  symbol: string;
  name: string;
  price: number | null | undefined;
  change: number | null | undefined;
  changePercent: number | null | undefined;
  currency?: string;
  type: 'stock' | 'crypto' | 'index' | 'future';
  exchange?: string;
  volume?: number;
  marketCap?: number;
  image?: string;
  showGraph?: boolean;
  graphData?: any[];
  sentimentMood?: string;
  onAdd?: () => void;
  onClick?: () => void;
  className?: string;
}

export const AssetCard = memo(function AssetCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  currency = 'USD',
  type,
  exchange,
  volume,
  marketCap,
  image,
  showGraph = false,
  graphData,
  sentimentMood,
  onAdd,
  onClick,
  className,
}: AssetCardProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const router = useRouter();
  const inWatchlist = isInWatchlist(symbol);

  // For indices (^DJI etc.), show friendly name as title instead of raw ticker
  const isIndex = symbol.startsWith('^');
  const displayTitle = isIndex ? name : symbol;
  const displaySubtitle = isIndex ? symbol : name;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (type === 'stock') {
      router.push(`/stocks/${symbol}`);
    } else if (type === 'crypto') {
      router.push(`/crypto/${symbol.toLowerCase()}`);
    }
  };

  const handleAddToWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(symbol);
    } else {
      addToWatchlist({ symbol, name, type });
    }
    onAdd?.();
  };

  return (
    <div className="w-full transition-transform duration-200 hover:-translate-y-1 active:scale-[0.99]">
      <Card
        className={cn(
          'p-5 cursor-pointer glass-card-premium glass-card-hover-premium group',
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {image && (
                <img src={image} alt={name} className="w-10 h-10 p-1 rounded-full ring-2 ring-white/20 dark:ring-white/10 bg-white dark:bg-neutral-800" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white tracking-tight truncate">
                  {displayTitle}
                </h3>
                <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 truncate">
                  {displaySubtitle}
                </p>
              </div>
            </div>
            {(exchange || type === 'crypto') && (
              <div className="flex items-center gap-2 mt-2">
                {type === 'crypto' && (
                  <Badge variant="default" className="text-xs px-2 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20">
                    CRYPTO
                  </Badge>
                )}
                {exchange && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-500">{exchange}</span>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddToWatchlist}
            className="shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {inWatchlist ? (
              <svg className="w-5 h-5 text-brand-500 fill-current" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </Button>
        </div>

        <PriceChange
          price={price}
          change={change}
          changePercent={changePercent}
          currency={currency}
          size="md"
        />

        {sentimentMood && (
          <div className="mt-2">
            <SentimentDot mood={sentimentMood} />
          </div>
        )}

        {(volume || marketCap) && (
          <div className="mt-4 pt-4 border-t border-white/10 dark:border-neutral-800">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {volume && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-500 font-medium">Volume</span>
                  <p className="font-semibold text-neutral-900 dark:text-white mt-1">
                    {volume >= 1e6 ? `${(volume / 1e6).toFixed(2)}M` : volume.toLocaleString()}
                  </p>
                </div>
              )}
              {marketCap && (
                <div>
                  <span className="text-neutral-500 dark:text-neutral-500 font-medium">Market Cap</span>
                  <p className="font-semibold text-neutral-900 dark:text-white mt-1">
                    {marketCap >= 1e12
                      ? `${(marketCap / 1e12).toFixed(2)}T`
                      : marketCap >= 1e9
                      ? `${(marketCap / 1e9).toFixed(2)}B`
                      : `${(marketCap / 1e6).toFixed(2)}M`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
});
