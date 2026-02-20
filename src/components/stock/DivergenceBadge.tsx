'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDivergence, DivergenceData } from '@/hooks/useDivergence';

const SIGNAL_CONFIG: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  caution_zone: {
    dot: 'bg-yellow-400',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
  },
  recovery_watch: {
    dot: 'bg-blue-400',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  strong_trend: {
    dot: 'bg-green-400',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20',
  },
  weak_trend: {
    dot: 'bg-red-400',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
};

interface DivergenceBadgeProps {
  symbol: string;
  name?: string;
}

export function DivergenceBadge({ symbol, name }: DivergenceBadgeProps) {
  const { divergence, loading, error } = useDivergence(symbol, name);
  const [expanded, setExpanded] = useState(false);

  if (loading || error || !divergence || divergence.signal === 'neutral') {
    return null;
  }

  const config = SIGNAL_CONFIG[divergence.signal];
  if (!config) return null;

  const priceChangeStr =
    divergence.price_change_30d_pct >= 0
      ? `+${divergence.price_change_30d_pct.toFixed(1)}%`
      : `${divergence.price_change_30d_pct.toFixed(1)}%`;

  return (
    <div
      className={`glass-card p-4 rounded-xl border ${config.border} cursor-pointer transition-all hover:shadow-md`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${config.dot} shrink-0`} />
        <span className={`text-sm font-medium ${config.text}`}>{divergence.label}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text} font-medium`}
        >
          30D: {priceChangeStr}
        </span>
        <svg
          className={`w-3.5 h-3.5 ml-auto text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
              {divergence.description}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
              Educational only — not a recommendation to buy, sell, or hold.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Compact inline divergence info for use inside modals/cards.
 */
export function DivergenceInfo({ divergence }: { divergence: DivergenceData }) {
  if (!divergence || divergence.signal === 'neutral') return null;

  const config = SIGNAL_CONFIG[divergence.signal];
  if (!config) return null;

  const priceChangeStr =
    divergence.price_change_30d_pct >= 0
      ? `+${divergence.price_change_30d_pct.toFixed(1)}%`
      : `${divergence.price_change_30d_pct.toFixed(1)}%`;

  return (
    <div className={`p-3 rounded-lg ${config.bg} border ${config.border}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className={`text-xs font-medium ${config.text}`}>{divergence.label}</span>
        <span className={`text-[10px] ${config.text}`}>30D: {priceChangeStr}</span>
      </div>
      <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-relaxed">
        {divergence.description}
      </p>
    </div>
  );
}
