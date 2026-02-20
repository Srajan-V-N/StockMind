'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTradingContext } from '@/contexts/TradingContext';
import { useLearningMode } from '@/contexts/LearningModeContext';
import { formatCurrency, formatCompactNumber } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';

interface HoldingsProps {
  onTrade: (symbol: string, type: 'stock' | 'crypto', action: 'buy' | 'sell') => void;
}

export function Holdings({ onTrade }: HoldingsProps) {
  const { portfolio } = useTradingContext();
  const { interactionLockedIds } = useLearningMode();

  const isLocked = (id: string) => interactionLockedIds.includes(id);

  if (portfolio.holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have any holdings yet.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Start trading to build your portfolio!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="guided-holdings">
      <CardHeader>
        <CardTitle>Current Holdings ({portfolio.holdings.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {portfolio.holdings.map((holding, index) => (
            <div
              key={`${holding.symbol}-${holding.type}`}
              className="glass-card p-4 rounded-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg truncate">{holding.symbol}</h3>
                    <Badge variant="outline" className="text-xs">
                      {holding.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Quantity</div>
                      <div className="font-semibold">
                        {formatCompactNumber(holding.quantity)}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Avg Price</div>
                      <div className="font-semibold">
                        {formatCurrency(holding.averagePrice, portfolio.baseCurrency)}
                      </div>
                    </div>

                    <div id={index === 0 ? 'guided-current-price' : undefined}>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">
                        Current Price
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(holding.currentPrice, portfolio.baseCurrency)}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Total Value</div>
                      <div className="font-semibold">
                        {formatCurrency(holding.currentValue, portfolio.baseCurrency)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Profit/Loss
                        </div>
                        <div
                          className={`font-semibold ${
                            holding.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {holding.profitLoss >= 0 ? '+' : ''}
                          {formatCurrency(holding.profitLoss, portfolio.baseCurrency)} (
                          {holding.profitLossPercent >= 0 ? '+' : ''}
                          {holding.profitLossPercent.toFixed(2)}%)
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => onTrade(holding.symbol, holding.type, 'buy')}
                        >
                          Buy More
                        </Button>
                        <Button
                          id={index === 0 ? 'guided-sell-button' : undefined}
                          variant="ghost"
                          size="sm"
                          onClick={() => onTrade(holding.symbol, holding.type, 'sell')}
                          className={`text-red-500 hover:text-red-600 hover:bg-red-500/10 ${
                            index === 0 && isLocked('guided-sell-button')
                              ? 'pointer-events-none opacity-50'
                              : ''
                          }`}
                          aria-disabled={index === 0 && isLocked('guided-sell-button') ? true : undefined}
                        >
                          Sell
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
