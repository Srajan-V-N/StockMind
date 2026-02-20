'use client';

import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTradingData } from '@/contexts/TradingContext';
import { GuidedModeState } from '@/types/guided';
import { GuidedStep } from '@/types/guided';
import { GUIDED_STEPS } from '@/lib/guidedSteps';
import { STORAGE_KEYS } from '@/lib/constants';

interface GuidedTradingContextType {
  state: GuidedModeState;
  currentStep: GuidedStep | null;
  totalSteps: number;
  startGuidedMode: () => void;
  stopGuidedMode: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  restartTutorial: () => void;
  resumeTutorial: () => void;
  hasCryptoHoldings: boolean;
}

const GuidedTradingContext = createContext<GuidedTradingContextType | undefined>(undefined);

const initialState: GuidedModeState = {
  isActive: false,
  currentStepIndex: 0,
  completedTutorial: false,
  hasSeenIntro: false,
};

export function GuidedTradingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorage<GuidedModeState>(
    STORAGE_KEYS.guidedMode,
    initialState
  );

  const { portfolio } = useTradingData();

  const hasCryptoHoldings = useMemo(
    () => portfolio.holdings.some((h) => h.type === 'crypto'),
    [portfolio.holdings]
  );

  const currentStep = useMemo(
    () => (state.isActive ? GUIDED_STEPS[state.currentStepIndex] ?? null : null),
    [state.isActive, state.currentStepIndex]
  );

  const startGuidedMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      currentStepIndex: 0,
      hasSeenIntro: true,
    }));
  }, [setState]);

  const stopGuidedMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, [setState]);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= GUIDED_STEPS.length) {
        return {
          ...prev,
          isActive: false,
          completedTutorial: true,
        };
      }
      return {
        ...prev,
        currentStepIndex: nextIndex,
      };
    });
  }, [setState]);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: Math.max(0, prev.currentStepIndex - 1),
    }));
  }, [setState]);

  const skipTutorial = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      completedTutorial: true,
    }));
  }, [setState]);

  const restartTutorial = useCallback(() => {
    setState({
      isActive: true,
      currentStepIndex: 0,
      completedTutorial: false,
      hasSeenIntro: true,
    });
  }, [setState]);

  const resumeTutorial = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
    }));
  }, [setState]);

  const value = useMemo(
    () => ({
      state,
      currentStep,
      totalSteps: GUIDED_STEPS.length,
      startGuidedMode,
      stopGuidedMode,
      nextStep,
      prevStep,
      skipTutorial,
      restartTutorial,
      resumeTutorial,
      hasCryptoHoldings,
    }),
    [
      state,
      currentStep,
      startGuidedMode,
      stopGuidedMode,
      nextStep,
      prevStep,
      skipTutorial,
      restartTutorial,
      resumeTutorial,
      hasCryptoHoldings,
    ]
  );

  return (
    <GuidedTradingContext.Provider value={value}>
      {children}
    </GuidedTradingContext.Provider>
  );
}

export function useGuidedTrading() {
  const context = useContext(GuidedTradingContext);
  if (!context) {
    throw new Error('useGuidedTrading must be used within GuidedTradingProvider');
  }
  return context;
}
