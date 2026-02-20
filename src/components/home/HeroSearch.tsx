'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/shared/SearchBar';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type SearchType = 'all' | 'stock' | 'crypto';

const searchFilters: { value: SearchType; label: string }[] = [
  { value: 'all', label: 'Both' },
  { value: 'stock', label: 'Stocks' },
  { value: 'crypto', label: 'Crypto' },
];

export function HeroSearch() {
  const [isFocused, setIsFocused] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('all');

  return (
    <div className="relative">
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
            onClick={() => setIsFocused(false)}
          />
        )}
      </AnimatePresence>

      <div className={`relative ${isFocused ? 'z-40' : 'z-10'}`}>
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Explore Global Markets</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Search for stocks, crypto, ETFs and discover investment opportunities
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <SearchBar
            type={searchType}
            placeholder={
              searchType === 'all'
                ? 'Search for stocks, crypto, ETFs & more'
                : searchType === 'stock'
                ? 'Search for stocks...'
                : 'Search for crypto...'
            }
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          />

          {/* Search Filter Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Search in:</span>
            <div className="flex gap-1.5">
              {searchFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSearchType(filter.value)}
                  className={cn(
                    'px-4 py-1.5 text-sm rounded-full transition-all duration-200 active:scale-95',
                    searchType === filter.value
                      ? 'bg-brand-500/20 text-brand-500 dark:text-brand-400 border border-brand-500/30'
                      : 'bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
