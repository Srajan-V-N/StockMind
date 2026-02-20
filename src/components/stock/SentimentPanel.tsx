'use client';

import { useState } from 'react';
import { useSentiment, SentimentData } from '@/hooks/useSentiment';
import { SentimentNewsDialog } from './SentimentNewsDialog';

const MOOD_CONFIG = {
  positive: { color: 'text-green-400', dot: 'bg-green-400', border: 'border-green-500/20', label: 'Positive' },
  neutral: { color: 'text-gray-400', dot: 'bg-gray-400', border: 'border-gray-500/20', label: 'Neutral' },
  negative: { color: 'text-red-400', dot: 'bg-red-400', border: 'border-red-500/20', label: 'Negative' },
  mixed: { color: 'text-yellow-400', dot: 'bg-yellow-400', border: 'border-yellow-500/20', label: 'Mixed' },
};

interface SentimentPanelProps {
  symbol: string;
  name?: string;
  compact?: boolean;
}

export function SentimentPanel({ symbol, name, compact = false }: SentimentPanelProps) {
  const { sentiment, loading, error } = useSentiment(symbol, name);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="glass-card p-4 rounded-xl animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !sentiment) return null;

  const mood = sentiment.mood || 'neutral';
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.neutral;

  if (compact) {
    return (
      <div className={`glass-card p-3 rounded-xl border ${config.border}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">News Sentiment</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card p-5 rounded-xl border ${config.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">News Sentiment</h3>
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* Percentage Bar */}
      <div className="w-full h-2 rounded-full overflow-hidden flex mb-3 bg-gray-200 dark:bg-gray-700">
        {sentiment.positive_pct > 0 && (
          <div
            className="h-full bg-green-400 transition-all"
            style={{ width: `${sentiment.positive_pct}%` }}
            title={`Positive: ${sentiment.positive_pct.toFixed(1)}%`}
          />
        )}
        {sentiment.neutral_pct > 0 && (
          <div
            className="h-full bg-gray-400 transition-all"
            style={{ width: `${sentiment.neutral_pct}%` }}
            title={`Neutral: ${sentiment.neutral_pct.toFixed(1)}%`}
          />
        )}
        {sentiment.mixed_pct > 0 && (
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{ width: `${sentiment.mixed_pct}%` }}
            title={`Mixed: ${sentiment.mixed_pct.toFixed(1)}%`}
          />
        )}
        {sentiment.negative_pct > 0 && (
          <div
            className="h-full bg-red-400 transition-all"
            style={{ width: `${sentiment.negative_pct}%` }}
            title={`Negative: ${sentiment.negative_pct.toFixed(1)}%`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-gray-400 mb-3">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{sentiment.positive_pct.toFixed(0)}% Positive</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />{sentiment.neutral_pct.toFixed(0)}% Neutral</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{sentiment.negative_pct.toFixed(0)}% Negative</span>
        {sentiment.mixed_pct > 0 && (
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />{sentiment.mixed_pct.toFixed(0)}% Mixed</span>
        )}
      </div>

      {/* Summary */}
      {sentiment.summary && (
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
          {sentiment.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
        {sentiment.classified_articles && sentiment.classified_articles.length > 0 ? (
          <button
            onClick={() => setNewsDialogOpen(true)}
            className="text-brand-500 hover:text-brand-400 underline underline-offset-2 transition-colors"
          >
            {sentiment.article_count} article{sentiment.article_count !== 1 ? 's' : ''} analyzed — View News
          </button>
        ) : (
          <span>{sentiment.article_count} article{sentiment.article_count !== 1 ? 's' : ''} analyzed</span>
        )}
        <span className="cursor-help" title="Based on analysis of recent financial news. Educational purposes only.">
          Educational only
        </span>
      </div>

      {sentiment.classified_articles && sentiment.classified_articles.length > 0 && (
        <SentimentNewsDialog
          open={newsDialogOpen}
          onOpenChange={setNewsDialogOpen}
          articles={sentiment.classified_articles}
          symbol={symbol}
          mood={mood}
        />
      )}
    </div>
  );
}

/**
 * Small mood indicator dot for cards.
 */
export function SentimentDot({ mood }: { mood?: string }) {
  const config = MOOD_CONFIG[(mood as keyof typeof MOOD_CONFIG) || 'neutral'] || MOOD_CONFIG.neutral;
  return (
    <div className="flex items-center gap-1" title={`News sentiment: ${config.label}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className={`text-[10px] ${config.color}`}>{config.label}</span>
    </div>
  );
}
