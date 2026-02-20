'use client';

import { useState } from 'react';
import { MentorAlert } from '@/types/mentor';
import { Button } from '@/components/ui/button';

const SEVERITY_STYLES = {
  info: 'border-blue-500/30 bg-blue-500/5',
  warning: 'border-yellow-500/30 bg-yellow-500/5',
  critical: 'border-red-500/30 bg-red-500/5',
};

const SEVERITY_ICONS = {
  info: (
    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  critical: (
    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const MOOD_BADGE: Record<string, { bg: string; text: string }> = {
  positive: { bg: 'bg-green-500/10', text: 'text-green-400' },
  neutral: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
  negative: { bg: 'bg-red-500/10', text: 'text-red-400' },
  mixed: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
};

const PATTERN_LABELS: Record<string, string> = {
  fomo_buy: 'FOMO Detection',
  panic_sell: 'Panic Selling',
  overtrading: 'Overtrading',
  over_concentration: 'Concentration Risk',
  holding_losers: 'Extended Loss',
  high_risk_position: 'Position Size',
  sentiment_fomo: 'Sentiment FOMO',
};

interface MentorAlertCardProps {
  alert: MentorAlert;
  onDismiss: (id: string) => void;
}

export function MentorAlertCard({ alert, onDismiss }: MentorAlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const severity = alert.severity as keyof typeof SEVERITY_STYLES;

  return (
    <div className={`rounded-xl border p-4 transition-all ${SEVERITY_STYLES[severity]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{SEVERITY_ICONS[severity]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {PATTERN_LABELS[alert.patternType] || alert.patternType}
            </span>
            {alert.symbol && (
              <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">{alert.symbol}</span>
            )}
            {(alert as any).sentimentMood && (() => {
              const mood = (alert as any).sentimentMood;
              const style = MOOD_BADGE[mood] || MOOD_BADGE.neutral;
              return (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                  Mood: {mood}
                </span>
              );
            })()}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{alert.message}</p>

          {alert.geminiFeedback && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                AI Mentor Insight
              </button>
              {expanded && (
                <div className="mt-2 p-3 rounded-lg bg-white/5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {alert.geminiFeedback}
                </div>
              )}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(alert.id)}
          className="flex-shrink-0 h-8 w-8 p-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
