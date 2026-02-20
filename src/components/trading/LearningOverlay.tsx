'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearningMode } from '@/contexts/LearningModeContext';
import { useChatbot } from '@/contexts/ChatbotContext';
import { Button } from '@/components/ui/button';
import { useOverlayPositioning } from '@/hooks/useOverlayPositioning';

const TOOLTIP_WIDTH = 440;

export function LearningOverlay() {
  const {
    state,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipLearning,
    hasCryptoHoldings,
  } = useLearningMode();
  const { openChatbot, sendMessage } = useChatbot();
  const [showCelebration, setShowCelebration] = useState(false);

  const { targetPos, tooltipPos, targetFound, tooltipRef } = useOverlayPositioning({
    targetElementId: currentStep?.targetElementId ?? null,
    placement: currentStep?.placement ?? 'bottom',
    isActive: state.isActive && !!currentStep,
    tooltipWidth: TOOLTIP_WIDTH,
    tooltipEstHeight: 450,
  });

  if (!state.isActive || !currentStep) {
    if (showCelebration) {
      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60"
            style={{ zIndex: 50 }}
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="glass-card rounded-3xl p-8 shadow-2xl border border-white/10 text-center max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🎓
              </motion.div>
              <h2 className="text-2xl font-bold gradient-text mb-3">
                Trading Fundamentals Complete!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                You&apos;ve completed all 11 lessons on trading fundamentals. You now understand
                company analysis, risk management, position sizing, exit strategies, and
                trading psychology. Keep practicing with virtual trades!
              </p>
              <Button onClick={() => setShowCelebration(false)}>
                Continue Trading
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      );
    }
    return null;
  }

  const content =
    hasCryptoHoldings && currentStep.cryptoContent
      ? currentStep.cryptoContent
      : currentStep.educationalContent;

  const progressPercent = (currentStep.stepNumber / totalSteps) * 100;
  const isConceptual = currentStep.conceptualStep || !currentStep.targetElementId;
  const isLastStep = currentStep.stepNumber === totalSteps;

  const handleAskMentor = () => {
    openChatbot();
    sendMessage(currentStep.mentorPrompt, {
      guidedModeContext: `The user is on Learning Mode step ${currentStep.stepNumber} of ${totalSteps}: "${currentStep.title}". They want a deeper educational explanation of this trading concept. Provide comprehensive, educational guidance. Remember: never give buy/sell advice or predict prices.`,
    });
  };

  const handleNext = () => {
    if (isLastStep) {
      setShowCelebration(true);
    }
    nextStep();
  };

  return (
    <>
      {/* Highlight ring over target element */}
      {targetFound && targetPos && !isConceptual && (
        <div
          className="guided-highlight-ring fixed rounded-lg pointer-events-none"
          style={{
            zIndex: 45,
            top: targetPos.top - 4,
            left: targetPos.left - 4,
            width: targetPos.width + 8,
            height: targetPos.height + 8,
          }}
        />
      )}

      {/* Dimming backdrop for conceptual steps or missing target */}
      {(isConceptual || !targetFound) && (
        <div
          className="fixed inset-0 bg-black/60"
          style={{ zIndex: 44 }}
          onClick={skipLearning}
        />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed glass-card rounded-2xl p-6 shadow-2xl border border-white/10"
          style={{
            zIndex: 46,
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: TOOLTIP_WIDTH,
            maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {/* Step badge + title */}
          <div className="flex items-center gap-3 mb-3">
            <span className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-brand-500 text-white text-sm font-bold flex items-center justify-center shadow-lg">
              {currentStep.stepNumber}
            </span>
            <div>
              <h3 className="text-lg font-bold gradient-text">{currentStep.title}</h3>
              <span className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold">
                Learning Mode
              </span>
            </div>
          </div>

          {/* Educational content */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {content}
          </p>

          {/* Key Concepts */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-2">
              Key Concepts
            </h4>
            <ul className="space-y-1.5">
              {currentStep.keyConcepts.map((concept, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5" />
                  {concept}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Tip */}
          <div className="mb-4 p-3 rounded-xl bg-purple-500/10 border-l-2 border-purple-400">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Pro Tip
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {currentStep.proTip}
            </p>
          </div>

          {/* Progress bar with step dots */}
          <div className="mb-4">
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between">
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < currentStep.stepNumber
                        ? 'bg-purple-500'
                        : i === currentStep.stepNumber - 1
                        ? 'bg-brand-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentStep.stepNumber} / {totalSteps}
              </span>
            </div>
          </div>

          {/* Missing target note */}
          {!isConceptual && !targetFound && (
            <p className="text-xs text-amber-500 dark:text-amber-400 mb-3 italic">
              This element isn&apos;t visible yet. Make a trade first, then come back to this step!
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {currentStep.stepNumber > 1 && (
                <Button variant="ghost" size="sm" onClick={prevStep}>
                  Back
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={skipLearning} className="text-gray-500">
                Skip
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="glass"
                size="sm"
                onClick={handleAskMentor}
                className="text-purple-500"
              >
                Ask Mentor
              </Button>
              <Button size="sm" onClick={handleNext}>
                {isLastStep ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
