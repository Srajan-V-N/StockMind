'use client';

import { useEffect, useRef } from 'react';
import { useTrading } from '@/contexts/TradingContext';

/**
 * Hook to automatically update prices for all holdings in the portfolio
 * Updates every 30 seconds
 */
export function useRealTimePrices() {
  const { portfolio, updateHoldingPrice } = useTrading();

  // Store in refs so the effect doesn't re-trigger when these change
  const holdingsRef = useRef(portfolio.holdings);
  holdingsRef.current = portfolio.holdings;

  const updatePriceRef = useRef(updateHoldingPrice);
  updatePriceRef.current = updateHoldingPrice;

  // Stable primitive — only changes when the set of held symbols changes
  const symbolsKey = portfolio.holdings
    .map(h => `${h.symbol}:${h.type}`)
    .sort()
    .join(',');

  useEffect(() => {
    if (!symbolsKey) return;

    const updatePrices = async () => {
      const holdings = holdingsRef.current;

      const pricePromises = holdings.map(async (holding) => {
        try {
          const endpoint = holding.type === 'stock'
            ? `/api/stocks/quote?symbol=${holding.symbol}`
            : `/api/crypto/price?id=${holding.symbol}`;

          const res = await fetch(endpoint);

          if (!res.ok) {
            console.error(`Failed to fetch price for ${holding.symbol}`);
            return null;
          }

          const data = await res.json();

          if (data.price) {
            return { symbol: holding.symbol, type: holding.type, price: data.price };
          }
          return null;
        } catch (error) {
          console.error(`Failed to update price for ${holding.symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(pricePromises);

      for (const result of results) {
        if (result) {
          updatePriceRef.current(result.symbol, result.type, result.price);
        }
      }
    };

    updatePrices();
    const interval = setInterval(updatePrices, 30000);

    return () => clearInterval(interval);
  }, [symbolsKey]);
}
