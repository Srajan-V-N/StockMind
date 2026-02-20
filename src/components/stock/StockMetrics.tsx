'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StockQuote } from '@/types/stock';
import { formatCurrency, formatCompactNumber } from '@/lib/formatters';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import { useCurrency } from '@/hooks/useCurrency';

interface StockMetricsProps {
  quote: StockQuote;
}

export function StockMetrics({ quote }: StockMetricsProps) {
  const { selectedCurrency } = useCurrencyContext();
  const { data: conversionData } = useCurrency(quote.currency, selectedCurrency, 1);

  // Get conversion rate, default to 1 if loading or error
  const conversionRate = conversionData?.rate || 1;
  const displayCurrency = selectedCurrency;

  // Convert currency values
  const convertValue = (value: number) => value * conversionRate;

  const metrics = [
    { label: 'Previous Close', value: formatCurrency(convertValue(quote.previousClose), displayCurrency) },
    { label: 'Day Range', value: `${formatCurrency(convertValue(quote.dayLow), displayCurrency)} - ${formatCurrency(convertValue(quote.dayHigh), displayCurrency)}` },
    { label: 'Year Range', value: `${formatCurrency(convertValue(quote.yearLow), displayCurrency)} - ${formatCurrency(convertValue(quote.yearHigh), displayCurrency)}` },
    { label: 'Market Cap', value: formatCompactNumber(quote.marketCap) },
    { label: 'Avg Volume', value: formatCompactNumber(quote.volume || quote.avgVolume) },
    { label: 'P/E Ratio', value: quote.pe ? quote.pe.toFixed(2) : 'N/A' },
    { label: 'Dividend Yield', value: quote.dividendYield ? `${quote.dividendYield.toFixed(2)}%` : 'N/A' },
    { label: 'Primary Exchange', value: quote.exchange },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex justify-between items-center py-2 border-b border-white/10 dark:border-white/5 last:border-b-0">
              <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
              <span className="font-semibold">{metric.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
