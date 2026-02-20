'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTradingContext } from '@/contexts/TradingContext';
import { formatCurrency } from '@/lib/formatters';
import { formatDistanceToNow } from 'date-fns';

export function TransactionHistory() {
  const { portfolio } = useTradingContext();

  // Memoize sorted transactions to prevent re-sorting on every render
  const sortedTransactions = useMemo(
    () => [...portfolio.transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    [portfolio.transactions]
  );

  if (portfolio.transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No transactions yet. Start trading to see your history here!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="guided-transactions">
      <CardHeader>
        <CardTitle>Transaction History ({portfolio.transactions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedTransactions.map((transaction) => {
            const timeAgo = formatDistanceToNow(new Date(transaction.timestamp), {
              addSuffix: true,
            });

            return (
              <div key={transaction.id} className="glass-card p-4 rounded-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={transaction.action === 'buy' ? 'default' : 'outline'}
                        className={
                          transaction.action === 'buy'
                            ? 'bg-green-500/20 text-green-500 border-green-500/50'
                            : 'bg-red-500/20 text-red-500 border-red-500/50'
                        }
                      >
                        {transaction.action.toUpperCase()}
                      </Badge>
                      <span className="font-semibold">{transaction.symbol}</span>
                      <Badge variant="outline" className="text-xs">
                        {transaction.type}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Quantity</div>
                        <div className="font-semibold">{transaction.quantity}</div>
                      </div>

                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Price</div>
                        <div className="font-semibold">
                          {formatCurrency(transaction.price, portfolio.baseCurrency)}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Total</div>
                        <div className="font-semibold">
                          {formatCurrency(transaction.total, portfolio.baseCurrency)}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Time</div>
                        <div className="font-semibold text-xs">{timeAgo}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
