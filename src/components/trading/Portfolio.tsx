'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTradingContext } from '@/contexts/TradingContext';
import { formatCurrency, formatCompactNumber } from '@/lib/formatters';

export function Portfolio() {
  const { portfolio } = useTradingContext();

  const totalValue = portfolio.balance + portfolio.holdings.reduce(
    (sum, holding) => sum + holding.currentValue,
    0
  );

  const totalProfitLoss = portfolio.holdings.reduce(
    (sum, holding) => sum + holding.profitLoss,
    0
  );

  const totalProfitLossPercent =
    ((totalValue - portfolio.startingBalance) / portfolio.startingBalance) * 100;

  const holdingsValue = portfolio.holdings.reduce(
    (sum, holding) => sum + holding.currentValue,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Total Value */}
          <div id="guided-total-value" className="text-center p-6 glass-card rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Total Portfolio Value
            </div>
            <div className="text-4xl font-bold mb-3">
              {formatCurrency(totalValue, portfolio.baseCurrency)}
            </div>
            <div
              className={`text-lg font-semibold ${
                totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {totalProfitLoss >= 0 ? '+' : ''}
              {formatCurrency(totalProfitLoss, portfolio.baseCurrency)} (
              {totalProfitLossPercent >= 0 ? '+' : ''}
              {totalProfitLossPercent.toFixed(2)}%)
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div id="guided-available-cash" className="glass-card p-4 rounded-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Available Cash
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(portfolio.balance, portfolio.baseCurrency)}
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Holdings Value
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(holdingsValue, portfolio.baseCurrency)}
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Number of Holdings
              </div>
              <div className="text-2xl font-bold">{portfolio.holdings.length}</div>
            </div>
          </div>

          {/* Allocation */}
          <div id="guided-allocation">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Portfolio Allocation
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <div
                className="bg-brand-500 transition-all"
                style={{
                  width: `${(portfolio.balance / totalValue) * 100}%`,
                }}
                title={`Cash: ${((portfolio.balance / totalValue) * 100).toFixed(1)}%`}
              />
              <div
                className="bg-green-500 transition-all"
                style={{
                  width: `${(holdingsValue / totalValue) * 100}%`,
                }}
                title={`Holdings: ${((holdingsValue / totalValue) * 100).toFixed(1)}%`}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                Cash: {((portfolio.balance / totalValue) * 100).toFixed(1)}%
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Holdings: {((holdingsValue / totalValue) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
