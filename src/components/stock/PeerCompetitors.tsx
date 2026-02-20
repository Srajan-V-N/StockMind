'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { SectorCompetitors } from '@/types/stock';
import { formatCurrency, formatMarketCap, formatPercent } from '@/lib/formatters';

interface PeerCompetitorsProps {
  sectors: SectorCompetitors[];
}

export function PeerCompetitors({ sectors }: PeerCompetitorsProps) {
  const router = useRouter();

  if (!sectors || sectors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peer Competitors (Sector-wise)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Competitor analysis unavailable</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later for updates</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peer Competitors (Sector-wise)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sectors.map((sector, index) => (
            <div key={index} className="pb-6 border-b border-white/10 dark:border-white/5 last:border-b-0 last:pb-0">
              <h3 className="font-semibold text-lg mb-3 text-brand-500">{sector.sectorName}</h3>
              <div className="space-y-1">
                {sector.competitors.map((competitor, idx) => {
                  const hasChange = competitor.change != null && !isNaN(competitor.change);
                  const isPositive = hasChange ? competitor.change >= 0 : true;

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-white/10 dark:hover:bg-white/5"
                      onClick={() => router.push(`/stocks/${competitor.symbol}`)}
                    >
                      {/* Logo */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                        {competitor.logo ? (
                          <img
                            src={competitor.logo}
                            alt={competitor.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={`text-xs font-bold text-gray-500 dark:text-gray-400 ${competitor.logo ? 'hidden' : ''}`}>
                          {competitor.symbol.slice(0, 2)}
                        </span>
                      </div>

                      {/* Name & Ticker */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {competitor.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {competitor.symbol}
                        </p>
                      </div>

                      {/* Price & Change */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {competitor.price ? formatCurrency(competitor.price) : '--'}
                        </p>
                        {hasChange && (
                          <p className={`text-xs font-medium ${isPositive ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-500'}`}>
                            {formatPercent(competitor.changePercent)}
                          </p>
                        )}
                      </div>

                      {/* Market Cap */}
                      {competitor.marketCap > 0 && (
                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <p className="text-xs text-gray-400 dark:text-gray-500">Mkt Cap</p>
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {formatMarketCap(competitor.marketCap)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
