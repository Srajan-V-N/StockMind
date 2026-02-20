'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, ReactNode } from 'react';
import { DailyScores, Badge, MonthlyReport } from '@/types/mentor';
import { API_ENDPOINTS } from '@/lib/constants';

interface EvaluationContextType {
  scores: DailyScores | null;
  badges: Badge[];
  activeBadges: Badge[];
  latestReport: MonthlyReport | null;
  isEligible: boolean;
  isLoading: boolean;
  insufficientData: Record<string, boolean>;
  refreshScores: () => Promise<void>;
  generateReport: () => Promise<void>;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

const RECOMPUTE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export function EvaluationProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<DailyScores | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [latestReport, setLatestReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [insufficientData, setInsufficientData] = useState<Record<string, boolean>>({});
  const lastComputeRef = useRef(0);

  const refreshScores = useCallback(async () => {
    setIsLoading(true);
    try {
      // Trigger computation if stale
      const now = Date.now();
      if (now - lastComputeRef.current > RECOMPUTE_INTERVAL) {
        lastComputeRef.current = now;
        await fetch(API_ENDPOINTS.evaluation.compute, { method: 'POST' }).catch(() => {});
      }

      // Fetch scores
      const [scoresRes, badgesRes, reportRes] = await Promise.all([
        fetch(API_ENDPOINTS.evaluation.scores, { cache: 'no-store' }),
        fetch(API_ENDPOINTS.evaluation.badges, { cache: 'no-store' }),
        fetch(API_ENDPOINTS.evaluation.reportLatest, { cache: 'no-store' }),
      ]);

      if (scoresRes.ok) {
        const data = await scoresRes.json();
        setScores(data.scores || null);
        setInsufficientData(data.scores?.insufficientData || {});
      }

      if (badgesRes.ok) {
        const data = await badgesRes.json();
        setBadges(data.badges || []);
      }

      if (reportRes.ok) {
        const data = await reportRes.json();
        setLatestReport(data.report || null);
      }
    } catch (err) {
      console.warn('Failed to refresh evaluation:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.evaluation.reportGenerate, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLatestReport(data.report || null);
      }
    } catch (err) {
      console.warn('Failed to generate report:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Defer load so it doesn't block initial render
  useEffect(() => {
    const id = setTimeout(() => refreshScores(), 2000);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isEligible = scores?.eligible ?? false;
  const activeBadges = badges.filter(b => b.active);

  const value = useMemo(() => ({
    scores, badges, activeBadges, latestReport, isEligible, isLoading,
    insufficientData, refreshScores, generateReport,
  }), [scores, badges, activeBadges, latestReport, isEligible, isLoading, insufficientData, refreshScores, generateReport]);

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
}

export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within EvaluationProvider');
  }
  return context;
}
