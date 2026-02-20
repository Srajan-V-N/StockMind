'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrencyContext } from '@/contexts/CurrencyContext';
import { CURRENCIES } from '@/lib/constants';

export function CurrencySelector() {
  const { selectedCurrency, setSelectedCurrency } = useCurrencyContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCurrencyData = CURRENCIES.find(c => c.code === selectedCurrency);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 glass-button text-sm font-medium text-neutral-900 dark:text-white transition-all hover:scale-105"
      >
        <span className="text-lg">{selectedCurrencyData?.symbol}</span>
        <span>{selectedCurrency}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-2 right-0 w-48 glass-dropdown-premium shadow-2xl z-50 max-h-80 overflow-y-auto"
          >
            {CURRENCIES.map((currency, index) => (
              <motion.button
                key={currency.code}
                onClick={() => {
                  setSelectedCurrency(currency.code);
                  setIsOpen(false);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                whileTap={{ scale: 0.98 }}
                className={`w-full px-4 py-3 text-left transition-colors border-b border-white/10 dark:border-neutral-800 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl ${
                  currency.code === selectedCurrency
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-neutral-900 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currency.symbol}</span>
                    <span className="font-semibold">{currency.code}</span>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {currency.name}
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
