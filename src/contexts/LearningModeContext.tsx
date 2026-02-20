'use client';

import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTradingData } from '@/contexts/TradingContext';
import { LearningModeState } from '@/types/learning';
import { LEARNING_STEPS } from '@/lib/learningSteps';
import { STORAGE_KEYS } from '@/lib/constants';

interface LearningModeContextType {
  state: LearningModeState;
  currentStep: typeof LEARNING_STEPS[number] | null;
  totalSteps: number;
  startLearning: () => void;
  stopLearning: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipLearning: () => void;
  restartLearning: () => void;
  resumeLearning: () => void;
  hasCryptoHoldings: boolean;
  interactionLockedIds: string[];
}

const LearningModeContext = createContext<LearningModeContextType | undefined>(undefined);

const initialState: LearningModeState = {
  isActive: false,
  currentStepIndex: 0,
  completedSteps: [],
  completedLearning: false,
  hasStartedLearning: false,
  earnedBadge: false,
};

export function LearningModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorage<LearningModeState>(
    STORAGE_KEYS.learningMode,
    initialState
  );

  const { portfolio } = useTradingData();

  const hasCryptoHoldings = useMemo(
    () => portfolio.holdings.some((h) => h.type === 'crypto'),
    [portfolio.holdings]
  );

  const currentStep = useMemo(
    () => (state.isActive ? LEARNING_STEPS[state.currentStepIndex] ?? null : null),
    [state.isActive, state.currentStepIndex]
  );

  const interactionLockedIds = useMemo(
    () => (currentStep?.interactionLockIds ?? []),
    [currentStep]
  );

  const startLearning = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      currentStepIndex: 0,
      hasStartedLearning: true,
      completedLearning: false,
      earnedBadge: prev.earnedBadge,
    }));
  }, [setState]);

  const stopLearning = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, [setState]);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const currentId = LEARNING_STEPS[prev.currentStepIndex]?.id;
      const newCompleted = currentId && !prev.completedSteps.includes(currentId)
        ? [...prev.completedSteps, currentId]
        : prev.completedSteps;

      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= LEARNING_STEPS.length) {
        return {
          ...prev,
          isActive: false,
          completedLearning: true,
          earnedBadge: true,
          completedSteps: newCompleted,
        };
      }
      return {
        ...prev,
        currentStepIndex: nextIndex,
        completedSteps: newCompleted,
      };
    });
  }, [setState]);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: Math.max(0, prev.currentStepIndex - 1),
    }));
  }, [setState]);

  const skipLearning = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, [setState]);

  const restartLearning = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      currentStepIndex: 0,
      completedSteps: [],
      completedLearning: false,
      hasStartedLearning: true,
    }));
  }, [setState]);

  const resumeLearning = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
    }));
  }, [setState]);

  const value = useMemo(
    () => ({
      state,
      currentStep,
      totalSteps: LEARNING_STEPS.length,
      startLearning,
      stopLearning,
      nextStep,
      prevStep,
      skipLearning,
      restartLearning,
      resumeLearning,
      hasCryptoHoldings,
      interactionLockedIds,
    }),
    [
      state,
      currentStep,
      startLearning,
      stopLearning,
      nextStep,
      prevStep,
      skipLearning,
      restartLearning,
      resumeLearning,
      hasCryptoHoldings,
      interactionLockedIds,
    ]
  );

  return (
    <LearningModeContext.Provider value={value}>
      {children}
    </LearningModeContext.Provider>
  );
}

export function useLearningMode() {
  const context = useContext(LearningModeContext);
  if (!context) {
    throw new Error('useLearningMode must be used within LearningModeProvider');
  }
  return context;
}
