'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { formatCurrency } from '@/lib/formatters';
import { formatDistanceToNow } from 'date-fns';

export function AlertsList() {
  const { alerts, removeAlert } = useNotificationContext();

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Price Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No active price alerts. Create one to get notified when prices reach your target!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Price Alerts ({alerts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const createdAgo = formatDistanceToNow(new Date(alert.createdAt), {
              addSuffix: true,
            });

            const isAbove = alert.condition === 'above';
            const triggeredAbove = alert.triggered && isAbove;
            const triggeredBelow = alert.triggered && !isAbove;

            return (
              <div
                key={alert.id}
                className={`glass-card p-4 rounded-xl border-l-4 transition-colors ${
                  triggeredAbove
                    ? 'border-l-green-500 bg-green-500/5 dark:bg-green-500/10'
                    : triggeredBelow
                    ? 'border-l-red-500 bg-red-500/5 dark:bg-red-500/10'
                    : 'border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {alert.triggered && (
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full ${
                          isAbove ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          <svg
                            className={`w-4 h-4 ${isAbove ? 'text-green-500' : 'text-red-500'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            {isAbove ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            )}
                          </svg>
                        </span>
                      )}
                      <h3 className="font-semibold text-lg">{alert.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {alert.type}
                      </Badge>
                      {alert.triggered && (
                        <Badge className={
                          isAbove
                            ? 'bg-green-500/20 text-green-500 border-green-500/50'
                            : 'bg-red-500/20 text-red-500 border-red-500/50'
                        }>
                          Triggered
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {alert.symbol}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">Alert when price goes</span>
                      <Badge
                        variant={isAbove ? 'default' : 'outline'}
                        className={
                          isAbove
                            ? 'bg-green-500/20 text-green-500 border-green-500/50'
                            : 'bg-red-500/20 text-red-500 border-red-500/50'
                        }
                      >
                        {alert.condition.toUpperCase()}
                      </Badge>
                      <span className="font-semibold">
                        {formatCurrency(alert.targetPrice, 'USD')}
                      </span>
                    </div>

                    {alert.currentPrice != null && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Current:</span>
                        <span className="font-semibold">{formatCurrency(alert.currentPrice, 'USD')}</span>
                        <span className="text-gray-400 dark:text-gray-500">→</span>
                        <span className="text-gray-600 dark:text-gray-400">Target:</span>
                        <span className="font-semibold">{formatCurrency(alert.targetPrice, 'USD')}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Created {createdAgo}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAlert(alert.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
