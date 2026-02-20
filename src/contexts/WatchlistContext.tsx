'use client';

import { createContext, useContext, ReactNode, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { WatchlistItem } from '@/types/api';
import { STORAGE_KEYS, API_ENDPOINTS } from '@/lib/constants';

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => void;
  removeFromWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  clearWatchlist: () => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useLocalStorage<WatchlistItem[]>(
    STORAGE_KEYS.watchlist,
    []
  );
  const hydratedRef = useRef(false);

  // Hydrate watchlist from DB on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    async function hydrateFromDB() {
      try {
        const res = await fetch(API_ENDPOINTS.db.watchlist, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.watchlist && Array.isArray(data.watchlist)) {
          const dbWatchlist: WatchlistItem[] = data.watchlist.map((w: any) => ({
            symbol: w.symbol,
            name: w.name,
            type: w.type,
            addedAt: new Date(w.addedAt),
          }));
          setWatchlist(dbWatchlist);
        }
      } catch (err) {
        console.warn('Failed to hydrate watchlist from DB:', err);
      }
    }

    hydrateFromDB();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addToWatchlist = useCallback((item: Omit<WatchlistItem, 'addedAt'>) => {
    setWatchlist(prev => {
      if (prev.some(w => w.symbol === item.symbol)) {
        return prev;
      }
      return [...prev, { ...item, addedAt: new Date() }];
    });

    fetch(API_ENDPOINTS.db.watchlist, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: item.symbol,
        name: item.name,
        type: item.type,
      }),
    }).catch(err => console.warn('Failed to persist watchlist add to DB:', err));
  }, [setWatchlist]);

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => prev.filter(item => item.symbol !== symbol));

    fetch(`${API_ENDPOINTS.db.watchlist}/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    }).catch(err => console.warn('Failed to persist watchlist remove to DB:', err));
  }, [setWatchlist]);

  const isInWatchlist = useCallback((symbol: string) => {
    return watchlist.some(item => item.symbol === symbol);
  }, [watchlist]);

  const clearWatchlist = useCallback(() => {
    watchlist.forEach(item => {
      fetch(`${API_ENDPOINTS.db.watchlist}/${encodeURIComponent(item.symbol)}`, {
        method: 'DELETE',
      }).catch(err => console.warn('Failed to persist watchlist clear to DB:', err));
    });

    setWatchlist([]);
  }, [watchlist, setWatchlist]);

  const value = useMemo(() => ({
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    clearWatchlist,
  }), [watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, clearWatchlist]);

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within WatchlistProvider');
  }
  return context;
}
