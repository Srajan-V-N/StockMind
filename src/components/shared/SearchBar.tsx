'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import { apiGet } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { StockSearchResult } from '@/types/stock';
import { CryptoSearchResult } from '@/types/crypto';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent } from '@/lib/formatters';

// Type guards for discriminated union
function isStockResult(result: any): result is StockSearchResult & { _type: 'stock' } {
  return result._type === 'stock' && 'symbol' in result && 'exchange' in result;
}

function isCryptoResult(result: any): result is CryptoSearchResult & { _type: 'crypto' } {
  return result._type === 'crypto' && 'id' in result;
}

// Discriminated union type for search results
type SearchResult =
  | (StockSearchResult & { _type: 'stock' })
  | (CryptoSearchResult & { _type: 'crypto' });

interface SearchBarProps {
  type?: 'all' | 'stock' | 'crypto';
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSelectAsset?: (symbol: string, name: string, type: 'stock' | 'crypto') => void;
}

export function SearchBar({
  type = 'all',
  placeholder = 'Search for stocks, crypto, ETFs & more',
  onFocus,
  onBlur,
  onSelectAsset,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      return;
    }

    // Reset current results when debounced query changes to avoid stale data
    setResults([]);
    setError(null);

    const search = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchPromises = [];

        if (type === 'all' || type === 'stock') {
          searchPromises.push(
            apiGet<StockSearchResult[] | { error: string }>(
              API_ENDPOINTS.stocks.search,
              { q: debouncedQuery }
            ).then(r => {
              // Handle error responses
              if (r && typeof r === 'object' && 'error' in r) {
                console.error('Stock search failed:', r.error);
                return [];
              }
              return Array.isArray(r)
                ? r.map(item => ({ ...item, _type: 'stock' as const }))
                : [];
            }).catch((err) => {
              console.error('Stock search failed:', err);
              return [];
            })
          );
        }

        if (type === 'all' || type === 'crypto') {
          searchPromises.push(
            apiGet<CryptoSearchResult[]>(API_ENDPOINTS.crypto.search, { q: debouncedQuery })
              .then(r => {
                if (!Array.isArray(r)) {
                  console.error('Crypto search did not return array:', r);
                  return [];
                }
                return r.map(item => {
                  if (!item.id) {
                    console.error('Crypto result missing id field:', item);
                  }
                  return { ...item, _type: 'crypto' as const };
                });
              })
              .catch((err) => {
                console.error('Crypto search failed:', err);
                return [];
              })
          );
        }

        const allResults = await Promise.all(searchPromises);
        const combined = allResults.flat();

        // Sort by relevance for better search results
        const queryLower = debouncedQuery.toLowerCase();
        const sortedResults = combined.sort((a, b) => {
          // Exact symbol match gets highest priority
          const aSymbolExact = a.symbol.toLowerCase() === queryLower;
          const bSymbolExact = b.symbol.toLowerCase() === queryLower;
          if (aSymbolExact && !bSymbolExact) return -1;
          if (!aSymbolExact && bSymbolExact) return 1;

          // Symbol starts with query
          const aSymbolStarts = a.symbol.toLowerCase().startsWith(queryLower);
          const bSymbolStarts = b.symbol.toLowerCase().startsWith(queryLower);
          if (aSymbolStarts && !bSymbolStarts) return -1;
          if (!aSymbolStarts && bSymbolStarts) return 1;

          // Name starts with query
          const aNameStarts = a.name.toLowerCase().startsWith(queryLower);
          const bNameStarts = b.name.toLowerCase().startsWith(queryLower);
          if (aNameStarts && !bNameStarts) return -1;
          if (!aNameStarts && bNameStarts) return 1;

          // Prefer stocks over crypto for ambiguous queries
          if (a._type === 'stock' && b._type === 'crypto') return -1;
          if (a._type === 'crypto' && b._type === 'stock') return 1;

          return 0;
        });

        const topResults = sortedResults.slice(0, 10);

        if (topResults.length === 0 && error) {
          // Show error message in dropdown
          setIsOpen(true);
        } else {
          setResults(topResults);
          setIsOpen(topResults.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to search. Please try again.');
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery, type]);

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

  const handleSelect = (result: SearchResult) => {
    if (isStockResult(result)) {
      const symbol = result.symbol;
      if (onSelectAsset) {
        onSelectAsset(symbol, result.name, 'stock');
      } else {
        router.push(`/stocks/${symbol}`);
      }
    } else if (isCryptoResult(result)) {
      const id = result.id;
      if (onSelectAsset) {
        onSelectAsset(id, result.name, 'crypto');
      } else {
        router.push(`/crypto/${id}`);
      }
    } else {
      console.error('Unknown result type:', result);
    }
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <svg
          className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 z-10 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            onFocus?.();
            if (results.length > 0) setIsOpen(true);
          }}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full h-14 pl-12 pr-12 glass-input-premium text-base font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-3 border-brand-200 dark:border-brand-900 border-t-brand-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-3 w-full glass-dropdown-premium max-h-96 overflow-y-auto z-50 shadow-2xl"
          >
            {results.map((result: any, index) => {
              const isStock = result._type === 'stock';
              const changePercent = isStock ? result.changePercent : result.changePercent24h;
              // Handle null/undefined - use neutral styling for unavailable data
              const hasValidChange = changePercent != null && !isNaN(changePercent);
              const isPositive = hasValidChange ? changePercent >= 0 : true; // Default to positive styling if no data

              return (
                <motion.button
                  key={`${result._type}-${isStock ? result.symbol : result.id}-${index}`}
                  onClick={() => handleSelect(result)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-5 py-4 text-left transition-colors border-b border-white/10 dark:border-neutral-800 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="font-semibold text-neutral-900 dark:text-white truncate">
                          {result.name}
                        </span>
                        {result.symbol && (
                          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                            {result.symbol}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        {isStock && (
                          <>
                            <span className="font-medium">{result.exchange}</span>
                            <span>•</span>
                            <span>{result.country}</span>
                          </>
                        )}
                        {!isStock && (
                          <span className="uppercase text-xs px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold border border-orange-500/30">
                            CRYPTO
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-neutral-900 dark:text-white mb-1">
                        {formatCurrency(result.price, isStock ? result.currency : 'USD')}
                      </div>
                      <div
                        className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-md inline-block',
                          !hasValidChange
                            ? 'text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800'
                            : isPositive
                              ? 'text-success-600 dark:text-success-500 bg-success-50 dark:bg-success-950/30'
                              : 'text-danger-600 dark:text-danger-500 bg-danger-50 dark:bg-danger-950/30'
                        )}
                      >
                        {formatPercent(changePercent)}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Loading State */}
        {isOpen && loading && results.length === 0 && query.length >= 2 && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-3 w-full glass-dropdown-premium p-5 z-50 shadow-2xl rounded-2xl"
          >
            <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
              <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-600 border-t-brand-500 rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Searching...</p>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {isOpen && error && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-3 w-full glass-dropdown-premium p-5 z-50 shadow-2xl rounded-2xl"
          >
            <div className="flex items-start gap-3 text-danger-600 dark:text-danger-500">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Search Error</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
