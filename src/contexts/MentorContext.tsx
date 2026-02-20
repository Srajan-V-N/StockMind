'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, ReactNode } from 'react';
import { MentorAlert } from '@/types/mentor';
import { API_ENDPOINTS } from '@/lib/constants';
import { useTradingData } from '@/contexts/TradingContext';

interface MentorContextType {
  alerts: MentorAlert[];
  activeAlerts: MentorAlert[];
  isAnalyzing: boolean;
  analyzePortfolio: () => Promise<void>;
  dismissAlert: (id: string) => void;
}

const MentorContext = createContext<MentorContextType | undefined>(undefined);

const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export function MentorProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<MentorAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const lastAnalyzedRef = useRef(0);
  const { portfolio } = useTradingData();
  const txCountRef = useRef(portfolio.transactions.length);

  const analyzePortfolio = useCallback(async () => {
    const now = Date.now();
    if (now - lastAnalyzedRef.current < THROTTLE_MS) return;

    setIsAnalyzing(true);
    lastAnalyzedRef.current = now;

    try {
      const res = await fetch(API_ENDPOINTS.mentor.analyze, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.alerts) {
          setAlerts(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const newAlerts = data.alerts.filter((a: MentorAlert) => !existingIds.has(a.id));
            return [...newAlerts, ...prev];
          });
        }
      }
    } catch (err) {
      console.warn('Mentor analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
    fetch(`${API_ENDPOINTS.mentor.dismiss}/${id}`, { method: 'POST' })
      .catch(err => console.warn('Failed to dismiss alert:', err));
  }, []);

  // Defer history load so it doesn't block initial render
  useEffect(() => {
    const id = setTimeout(() => {
      async function loadHistory() {
        try {
          const res = await fetch(API_ENDPOINTS.mentor.history, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.triggers) {
              setAlerts(data.triggers);
            }
          }
        } catch {
          // Silently fail
        }
      }
      loadHistory();
    }, 2000);
    return () => clearTimeout(id);
  }, []);

  // Auto-analyze after trades
  useEffect(() => {
    const currentCount = portfolio.transactions.length;
    if (currentCount > txCountRef.current) {
      txCountRef.current = currentCount;
      // Delay analysis slightly to let DB persist
      const timer = setTimeout(() => analyzePortfolio(), 3000);
      return () => clearTimeout(timer);
    }
  }, [portfolio.transactions.length, analyzePortfolio]);

  const activeAlerts = alerts.filter(a => !a.dismissed);

  const value = useMemo(() => ({
    alerts, activeAlerts, isAnalyzing, analyzePortfolio, dismissAlert,
  }), [alerts, activeAlerts, isAnalyzing, analyzePortfolio, dismissAlert]);

  return (
    <MentorContext.Provider value={value}>
      {children}
    </MentorContext.Provider>
  );
}

export function useMentor() {
  const context = useContext(MentorContext);
  if (!context) {
    throw new Error('useMentor must be used within MentorProvider');
  }
  return context;
}
