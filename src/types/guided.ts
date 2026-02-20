export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface GuidedStep {
  id: string;
  stepNumber: number;
  targetElementId: string;
  title: string;
  description: string;
  cryptoDescription?: string;
  placement: TooltipPlacement;
  chatbotPrompt: string;
}

export interface GuidedModeState {
  isActive: boolean;
  currentStepIndex: number;
  completedTutorial: boolean;
  hasSeenIntro: boolean;
}
