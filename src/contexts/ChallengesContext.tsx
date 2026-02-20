'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { Challenge } from '@/types/mentor';
import { API_ENDPOINTS } from '@/lib/constants';

interface ChallengesContextType {
  activeChallenges: Challenge[];
  completedChallenges: Challenge[];
  isLoading: boolean;
  refreshChallenges: () => Promise<void>;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function ChallengesProvider({ children }: { children: ReactNode }) {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshChallenges = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        fetch(API_ENDPOINTS.challenges.active, { cache: 'no-store' }),
        fetch(API_ENDPOINTS.challenges.history, { cache: 'no-store' }),
      ]);

      if (activeRes.ok) {
        const data = await activeRes.json();
        setActiveChallenges(data.challenges || []);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setCompletedChallenges(data.challenges || []);
      }
    } catch (err) {
      console.warn('Failed to refresh challenges:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Defer load so it doesn't block initial render
  useEffect(() => {
    const id = setTimeout(() => refreshChallenges(), 2000);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ChallengesContext.Provider value={useMemo(() => ({ activeChallenges, completedChallenges, isLoading, refreshChallenges }), [activeChallenges, completedChallenges, isLoading, refreshChallenges])}>
      {children}
    </ChallengesContext.Provider>
  );
}

export function useChallenges() {
  const context = useContext(ChallengesContext);
  if (!context) {
    throw new Error('useChallenges must be used within ChallengesProvider');
  }
  return context;
}
