'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency, formatCompactNumber } from '@/lib/formatters';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import { useCurrency } from '@/hooks/useCurrency';
import { CryptoPrice } from '@/types/crypto';

interface CryptoMetricsProps {
  crypto: CryptoPrice;
}

export function CryptoMetrics({ crypto }: CryptoMetricsProps) {
  const { selectedCurrency } = useCurrencyContext();
  const { data: conversionData } = useCurrency('USD', selectedCurrency, 1);

  // Get conversion rate, default to 1 if loading or error
  const conversionRate = conversionData?.rate || 1;
  const displayCurrency = selectedCurrency;

  // Convert currency values
  const convertValue = (value: number) => value * conversionRate;

  const metrics = [
    {
      label: 'Market Cap',
      value: formatCompactNumber(crypto.marketCap),
    },
    {
      label: '24h Volume',
      value: formatCompactNumber(crypto.volume),
    },
    {
      label: '24h Range',
      value: crypto.low24h && crypto.high24h
        ? `${formatCurrency(convertValue(crypto.low24h), displayCurrency)} - ${formatCurrency(convertValue(crypto.high24h), displayCurrency)}`
        : 'N/A',
    },
    {
      label: 'Circulating Supply',
      value: crypto.circulatingSupply
        ? `${formatCompactNumber(crypto.circulatingSupply)} ${crypto.symbol.toUpperCase()}`
        : 'N/A',
    },
    {
      label: 'Total Supply',
      value: crypto.totalSupply
        ? `${formatCompactNumber(crypto.totalSupply)} ${crypto.symbol.toUpperCase()}`
        : 'N/A',
    },
    {
      label: 'All-Time High',
      value: crypto.allTimeHigh ? formatCurrency(convertValue(crypto.allTimeHigh), displayCurrency) : 'N/A',
    },
    {
      label: 'All-Time Low',
      value: crypto.allTimeLow ? formatCurrency(convertValue(crypto.allTimeLow), displayCurrency) : 'N/A',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex justify-between items-center py-2 border-b border-white/10 dark:border-white/5 last:border-b-0"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {metric.label}
              </span>
              <span className="font-semibold">{metric.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
