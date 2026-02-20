import { TooltipPlacement } from './guided';

export interface LearningStep {
  id: string;
  stepNumber: number;
  targetElementId: string | null;
  title: string;
  educationalContent: string;
  cryptoContent?: string;
  keyConcepts: string[];
  proTip: string;
  placement: TooltipPlacement;
  mentorPrompt: string;
  interactionLockIds?: string[];
  conceptualStep?: boolean;
}

export interface LearningModeState {
  isActive: boolean;
  currentStepIndex: number;
  completedSteps: string[];
  completedLearning: boolean;
  hasStartedLearning: boolean;
  earnedBadge: boolean;
}
