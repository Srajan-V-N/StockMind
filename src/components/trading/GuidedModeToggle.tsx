'use client';

import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useGuidedTrading } from '@/contexts/GuidedTradingContext';
import { useLearningMode } from '@/contexts/LearningModeContext';
import { LearningBadge } from './LearningBadge';

export function GuidedModeToggle() {
  const {
    state: guidedState,
    startGuidedMode,
    stopGuidedMode,
    restartTutorial,
    resumeTutorial,
  } = useGuidedTrading();

  const {
    state: learningState,
    startLearning,
    stopLearning,
    restartLearning,
    resumeLearning,
  } = useLearningMode();

  const handleGuidedToggle = (checked: boolean) => {
    if (checked) {
      // Mutual exclusion: deactivate learning mode first
      if (learningState.isActive) {
        stopLearning();
      }
      startGuidedMode();
    } else {
      stopGuidedMode();
    }
  };

  const handleLearningToggle = (checked: boolean) => {
    if (checked) {
      // Mutual exclusion: deactivate guided mode first
      if (guidedState.isActive) {
        stopGuidedMode();
      }
      startLearning();
    } else {
      stopLearning();
    }
  };

  const showGuidedRestart = guidedState.completedTutorial && !guidedState.isActive;
  const showGuidedResume =
    !guidedState.completedTutorial &&
    guidedState.hasSeenIntro &&
    !guidedState.isActive &&
    guidedState.currentStepIndex > 0;

  const showLearningRestart = learningState.completedLearning && !learningState.isActive;
  const showLearningResume =
    !learningState.completedLearning &&
    learningState.hasStartedLearning &&
    !learningState.isActive &&
    learningState.currentStepIndex > 0;

  return (
    <div className="flex flex-col items-center gap-3 mb-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Interface Tour toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={guidedState.isActive} onCheckedChange={handleGuidedToggle} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Interface Tour
            </span>
          </label>
          {showGuidedRestart && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (learningState.isActive) stopLearning();
                restartTutorial();
              }}
              className="text-brand-500"
            >
              Restart
            </Button>
          )}
          {showGuidedResume && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (learningState.isActive) stopLearning();
                resumeTutorial();
              }}
              className="text-brand-500"
            >
              Resume
            </Button>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 hidden sm:block" />

        {/* Learning Mode toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={learningState.isActive} onCheckedChange={handleLearningToggle} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Learning Mode
            </span>
          </label>
          {showLearningRestart && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (guidedState.isActive) stopGuidedMode();
                restartLearning();
              }}
              className="text-purple-500"
            >
              Restart
            </Button>
          )}
          {showLearningResume && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (guidedState.isActive) stopGuidedMode();
                resumeLearning();
              }}
              className="text-purple-500"
            >
              Resume
            </Button>
          )}
        </div>
      </div>

      {/* Learning completion badge */}
      {learningState.earnedBadge && !learningState.isActive && <LearningBadge />}
    </div>
  );
}
