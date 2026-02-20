'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGuidedTrading } from '@/contexts/GuidedTradingContext';
import { useChatbot } from '@/contexts/ChatbotContext';
import { Button } from '@/components/ui/button';
import { useOverlayPositioning } from '@/hooks/useOverlayPositioning';

const TOOLTIP_WIDTH = 380;

export function GuidedOverlay() {
  const {
    state,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTutorial,
    hasCryptoHoldings,
  } = useGuidedTrading();
  const { openChatbot, sendMessage } = useChatbot();

  const { targetPos, tooltipPos, targetFound, tooltipRef } = useOverlayPositioning({
    targetElementId: currentStep?.targetElementId ?? null,
    placement: currentStep?.placement ?? 'bottom',
    isActive: state.isActive && !!currentStep,
    tooltipWidth: TOOLTIP_WIDTH,
  });

  if (!state.isActive || !currentStep) return null;

  const description =
    hasCryptoHoldings && currentStep.cryptoDescription
      ? currentStep.cryptoDescription
      : currentStep.description;

  const progressPercent = ((currentStep.stepNumber) / totalSteps) * 100;

  const handleAskAI = () => {
    openChatbot();
    sendMessage(currentStep.chatbotPrompt, {
      guidedModeContext: `The user is on step ${currentStep.stepNumber} of the guided trading tutorial: "${currentStep.title}". They are learning about this topic. Provide a clear, educational explanation.`,
    });
  };

  return (
    <>
      {/* Highlight ring over target element */}
      {targetFound && targetPos && (
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

      {/* Dimming backdrop when target not found */}
      {!targetFound && (
        <div
          className="fixed inset-0 bg-black/60"
          style={{ zIndex: 44 }}
          onClick={skipTutorial}
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
          className="fixed glass-card rounded-2xl p-5 shadow-2xl border border-white/10"
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
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center">
              {currentStep.stepNumber}
            </span>
            <h3 className="text-lg font-bold gradient-text">{currentStep.title}</h3>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {description}
          </p>

          {/* Missing target note */}
          {!targetFound && (
            <p className="text-xs text-amber-500 dark:text-amber-400 mb-3 italic">
              This element isn't visible yet. Try making a trade first, then come back to this step!
            </p>
          )}

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step counter */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Step {currentStep.stepNumber} of {totalSteps}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {currentStep.stepNumber > 1 && (
                <Button variant="ghost" size="sm" onClick={prevStep}>
                  Back
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={skipTutorial} className="text-gray-500">
                Skip
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="glass"
                size="sm"
                onClick={handleAskAI}
                className="text-brand-500"
              >
                Ask AI
              </Button>
              <Button size="sm" onClick={nextStep}>
                {currentStep.stepNumber === totalSteps ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
