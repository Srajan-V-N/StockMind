'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useLocalStorage('stockmind-currency', 'USD');

  return (
    <CurrencyContext.Provider value={useMemo(() => ({ selectedCurrency, setSelectedCurrency }), [selectedCurrency, setSelectedCurrency])}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencyContext() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrencyContext must be used within CurrencyProvider');
  }
  return context;
}

// Alias for consistency with other contexts
export const useGlobalCurrency = useCurrencyContext;
