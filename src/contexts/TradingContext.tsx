'use client';

import { createContext, useContext, ReactNode, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Portfolio, Holding, Transaction, TradeFormData } from '@/types/trading';
import { ChartDataPoint } from '@/types/chart';
import { STORAGE_KEYS, DEFAULTS, API_ENDPOINTS } from '@/lib/constants';

// Split into data and actions contexts to prevent unnecessary re-renders
interface TradingDataContextType {
  portfolio: Portfolio;
  getTotalValue: () => number;
  getProfitLoss: () => number;
  getProfitLossPercent: () => number;
  getPerformanceData: () => ChartDataPoint[];
}

interface TradingActionsContextType {
  buyAsset: (data: Omit<TradeFormData, 'action'>) => { success: boolean; message: string };
  sellAsset: (data: Omit<TradeFormData, 'action'>) => { success: boolean; message: string };
  updateHoldingPrice: (symbol: string, type: 'stock' | 'crypto', currentPrice: number) => void;
  resetPortfolio: () => void;
}

const TradingDataContext = createContext<TradingDataContextType | undefined>(undefined);
const TradingActionsContext = createContext<TradingActionsContextType | undefined>(undefined);

const initialPortfolio: Portfolio = {
  balance: DEFAULTS.portfolio.startingBalance,
  baseCurrency: DEFAULTS.portfolio.baseCurrency,
  holdings: [],
  transactions: [],
  startingBalance: DEFAULTS.portfolio.startingBalance,
  createdAt: '1970-01-01T00:00:00.000Z',
};

export function TradingProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useLocalStorage<Portfolio>(
    STORAGE_KEYS.portfolio,
    initialPortfolio
  );
  const hydratedRef = useRef(false);

  // Hydrate from DB on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    async function hydrateFromDB() {
      try {
        const res = await fetch(API_ENDPOINTS.db.portfolio, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const dbPortfolio = data.portfolio;
        if (!dbPortfolio) return;

        // Rebuild holdings with computed fields using DB data
        const holdings: Holding[] = (dbPortfolio.holdings || []).map((h: any) => ({
          symbol: h.symbol,
          type: h.type,
          name: h.name,
          quantity: h.quantity,
          averagePrice: h.averagePrice,
          currentPrice: h.averagePrice, // Will be updated by price refresh
          totalCost: h.quantity * h.averagePrice,
          currentValue: h.quantity * h.averagePrice,
          profitLoss: 0,
          profitLossPercent: 0,
        }));

        const transactions: Transaction[] = (dbPortfolio.transactions || []).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp).toISOString(),
        }));

        setPortfolio({
          balance: dbPortfolio.balance,
          baseCurrency: dbPortfolio.baseCurrency || DEFAULTS.portfolio.baseCurrency,
          holdings,
          transactions,
          startingBalance: dbPortfolio.startingBalance,
          createdAt: new Date(dbPortfolio.createdAt).toISOString(),
        });
      } catch (err) {
        // DB unavailable - gracefully degrade to localStorage data
        console.warn('Failed to hydrate portfolio from DB:', err);
      }
    }

    hydrateFromDB();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buyAsset = useCallback((data: Omit<TradeFormData, 'action'>) => {
    const { symbol, name, type, quantity, price } = data;
    const totalCost = quantity * price;

    if (quantity <= 0) {
      return { success: false, message: 'Invalid quantity' };
    }

    let success = false;
    let message = '';

    setPortfolio(prev => {
      // Check balance using prev state
      if (totalCost > prev.balance) {
        message = 'Insufficient balance';
        return prev;
      }

      success = true;
      message = `Successfully bought ${quantity} ${symbol}`;

      // Update or create holding
      const existingHoldingIndex = prev.holdings.findIndex(
        h => h.symbol === symbol && h.type === type
      );

      let updatedHoldings: Holding[];

      if (existingHoldingIndex !== -1) {
        // Update existing holding
        const existing = prev.holdings[existingHoldingIndex];
        const newQuantity = existing.quantity + quantity;
        const newAveragePrice =
          (existing.quantity * existing.averagePrice + quantity * price) / newQuantity;

        updatedHoldings = [...prev.holdings];
        updatedHoldings[existingHoldingIndex] = {
          ...existing,
          quantity: newQuantity,
          averagePrice: newAveragePrice,
          totalCost: newQuantity * newAveragePrice,
          currentValue: newQuantity * price,
          currentPrice: price,
          profitLoss: newQuantity * (price - newAveragePrice),
          profitLossPercent: ((price - newAveragePrice) / newAveragePrice) * 100,
        };
      } else {
        // Add new holding
        updatedHoldings = [
          ...prev.holdings,
          {
            symbol,
            name,
            type,
            quantity,
            averagePrice: price,
            currentPrice: price,
            totalCost: totalCost,
            currentValue: totalCost,
            profitLoss: 0,
            profitLossPercent: 0,
          },
        ];
      }

      // Add transaction
      const newTransaction: Transaction = {
        id: `${Date.now()}-${Math.random()}`,
        symbol,
        name,
        type,
        action: 'buy',
        quantity,
        price,
        total: totalCost,
        timestamp: new Date().toISOString(),
      };

      return {
        ...prev,
        balance: prev.balance - totalCost,
        holdings: updatedHoldings,
        transactions: [newTransaction, ...prev.transactions],
      };
    });

    // Persist to DB in background
    if (success) {
      fetch(API_ENDPOINTS.db.trade, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, name, type, action: 'buy', quantity, price }),
      }).catch(err => console.warn('Failed to persist trade to DB:', err));
    }

    return { success, message };
  }, [setPortfolio]);

  const sellAsset = useCallback((data: Omit<TradeFormData, 'action'>) => {
    const { symbol, name, type, quantity, price } = data;

    if (quantity <= 0) {
      return { success: false, message: 'Invalid quantity' };
    }

    const totalRevenue = quantity * price;
    let success = false;
    let message = '';

    setPortfolio(prev => {
      // Check holdings using prev state
      const holding = prev.holdings.find(h => h.symbol === symbol && h.type === type);

      if (!holding) {
        message = 'You do not own this asset';
        return prev;
      }

      if (holding.quantity < quantity) {
        message = 'Insufficient holdings';
        return prev;
      }

      success = true;
      message = `Successfully sold ${quantity} ${symbol}`;

      // Update or remove holding
      const holdingIndex = prev.holdings.findIndex(
        h => h.symbol === symbol && h.type === type
      );

      let updatedHoldings: Holding[];

      if (holding.quantity === quantity) {
        // Remove holding entirely
        updatedHoldings = prev.holdings.filter((_, idx) => idx !== holdingIndex);
      } else {
        // Reduce holding
        const newQuantity = holding.quantity - quantity;
        updatedHoldings = [...prev.holdings];
        updatedHoldings[holdingIndex] = {
          ...holding,
          quantity: newQuantity,
          totalCost: newQuantity * holding.averagePrice,
          currentValue: newQuantity * price,
          currentPrice: price,
          profitLoss: newQuantity * (price - holding.averagePrice),
          profitLossPercent: ((price - holding.averagePrice) / holding.averagePrice) * 100,
        };
      }

      // Add transaction
      const newTransaction: Transaction = {
        id: `${Date.now()}-${Math.random()}`,
        symbol,
        name,
        type,
        action: 'sell',
        quantity,
        price,
        total: totalRevenue,
        timestamp: new Date().toISOString(),
      };

      return {
        ...prev,
        balance: prev.balance + totalRevenue,
        holdings: updatedHoldings,
        transactions: [newTransaction, ...prev.transactions],
      };
    });

    // Persist to DB in background
    if (success) {
      fetch(API_ENDPOINTS.db.trade, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, name, type, action: 'sell', quantity, price }),
      }).catch(err => console.warn('Failed to persist trade to DB:', err));
    }

    return { success, message };
  }, [setPortfolio]);

  const getTotalValue = useCallback(() => {
    const holdingsValue = portfolio.holdings.reduce(
      (sum, h) => sum + h.currentValue,
      0
    );
    return portfolio.balance + holdingsValue;
  }, [portfolio.balance, portfolio.holdings]);

  const getProfitLoss = useCallback(() => {
    return getTotalValue() - portfolio.startingBalance;
  }, [getTotalValue, portfolio.startingBalance]);

  const getProfitLossPercent = useCallback(() => {
    const profitLoss = getProfitLoss();
    return (profitLoss / portfolio.startingBalance) * 100;
  }, [getProfitLoss, portfolio.startingBalance]);

  const getPerformanceData = useCallback(() => {
    // Generate time series from transactions showing portfolio value over time
    const dataPoints: ChartDataPoint[] = [];

    // Start with initial balance
    dataPoints.push({
      time: new Date(portfolio.createdAt).toISOString(),
      value: portfolio.startingBalance,
    });

    // Sort transactions by timestamp (oldest first)
    const sortedTransactions = [...portfolio.transactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Track cumulative balance and holdings value at each transaction
    let runningBalance = portfolio.startingBalance;
    const holdingsMap = new Map<string, { quantity: number; price: number }>();

    for (const tx of sortedTransactions) {
      const key = `${tx.symbol}-${tx.type}`;

      if (tx.action === 'buy') {
        // Subtract cost from balance
        runningBalance -= tx.total;

        // Add to holdings
        const existing = holdingsMap.get(key);
        if (existing) {
          holdingsMap.set(key, {
            quantity: existing.quantity + tx.quantity,
            price: tx.price, // Use latest price for simplicity
          });
        } else {
          holdingsMap.set(key, { quantity: tx.quantity, price: tx.price });
        }
      } else if (tx.action === 'sell') {
        // Add revenue to balance
        runningBalance += tx.total;

        // Remove from holdings
        const existing = holdingsMap.get(key);
        if (existing) {
          const newQuantity = existing.quantity - tx.quantity;
          if (newQuantity > 0) {
            holdingsMap.set(key, { ...existing, quantity: newQuantity });
          } else {
            holdingsMap.delete(key);
          }
        }
      }

      // Calculate total portfolio value at this point
      let holdingsValue = 0;
      holdingsMap.forEach(h => {
        holdingsValue += h.quantity * h.price;
      });

      const totalValue = runningBalance + holdingsValue;

      dataPoints.push({
        time: new Date(tx.timestamp).toISOString(),
        value: totalValue,
      });
    }

    // End with current total value
    if (dataPoints.length === 1 || dataPoints[dataPoints.length - 1].value !== getTotalValue()) {
      dataPoints.push({
        time: new Date().toISOString(),
        value: getTotalValue(),
      });
    }

    return dataPoints;
  }, [portfolio.createdAt, portfolio.startingBalance, portfolio.transactions, getTotalValue]);

  const updateHoldingPrice = useCallback((
    symbol: string,
    type: 'stock' | 'crypto',
    currentPrice: number
  ) => {
    setPortfolio(prev => {
      const updatedHoldings = prev.holdings.map(h => {
        if (h.symbol === symbol && h.type === type) {
          const currentValue = h.quantity * currentPrice;
          const profitLoss = currentValue - h.totalCost;
          const profitLossPercent = (profitLoss / h.totalCost) * 100;

          return {
            ...h,
            currentPrice,
            currentValue,
            profitLoss,
            profitLossPercent,
          };
        }
        return h;
      });

      return {
        ...prev,
        holdings: updatedHoldings,
      };
    });
  }, [setPortfolio]);

  const resetPortfolio = useCallback(() => {
    setPortfolio(initialPortfolio);

    // Persist reset to DB in background
    fetch(API_ENDPOINTS.db.resetPortfolio, { method: 'POST' })
      .catch(err => console.warn('Failed to persist portfolio reset to DB:', err));
  }, [setPortfolio]);

  // Memoize data context value to prevent re-renders
  const dataValue = useMemo(() => ({
    portfolio,
    getTotalValue,
    getProfitLoss,
    getProfitLossPercent,
    getPerformanceData,
  }), [portfolio, getTotalValue, getProfitLoss, getProfitLossPercent, getPerformanceData]);

  // Memoize actions context value (stable - won't change)
  const actionsValue = useMemo(() => ({
    buyAsset,
    sellAsset,
    updateHoldingPrice,
    resetPortfolio,
  }), [buyAsset, sellAsset, updateHoldingPrice, resetPortfolio]);

  return (
    <TradingDataContext.Provider value={dataValue}>
      <TradingActionsContext.Provider value={actionsValue}>
        {children}
      </TradingActionsContext.Provider>
    </TradingDataContext.Provider>
  );
}

// Hook for accessing portfolio data and calculations
export function useTradingData() {
  const context = useContext(TradingDataContext);
  if (!context) {
    throw new Error('useTradingData must be used within TradingProvider');
  }
  return context;
}

// Hook for accessing trading actions
export function useTradingActions() {
  const context = useContext(TradingActionsContext);
  if (!context) {
    throw new Error('useTradingActions must be used within TradingProvider');
  }
  return context;
}

// Combined hook for backward compatibility
export function useTrading() {
  const data = useTradingData();
  const actions = useTradingActions();
  return { ...data, ...actions };
}

// Alias for consistency
export const useTradingContext = useTrading;
