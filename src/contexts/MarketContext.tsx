'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MarketType, IndexData, FutureData } from '@/types/api';
import { STORAGE_KEYS, DEFAULTS } from '@/lib/constants';

interface MarketContextType {
  selectedMarket: MarketType;
  setSelectedMarket: (market: MarketType) => void;
  defaultCurrency: string;
  setDefaultCurrency: (currency: string) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: ReactNode }) {
  const [selectedMarket, setSelectedMarket] = useLocalStorage<MarketType>(
    STORAGE_KEYS.market,
    DEFAULTS.market
  );

  const [defaultCurrency, setDefaultCurrency] = useLocalStorage<string>(
    'stockmind-currency',
    'USD'
  );

  const value = useMemo(() => ({
    selectedMarket,
    setSelectedMarket,
    defaultCurrency,
    setDefaultCurrency,
  }), [selectedMarket, setSelectedMarket, defaultCurrency, setDefaultCurrency]);

  return (
    <MarketContext.Provider value={value}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within MarketProvider');
  }
  return context;
}
