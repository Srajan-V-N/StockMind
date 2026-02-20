'use client';

import { useState, useEffect } from 'react';
import { MonthlyReport } from '@/types/mentor';
import { API_ENDPOINTS } from '@/lib/constants';

interface MonthlyReportCardProps {
  report: MonthlyReport;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-green-400',
  'A': 'text-green-400',
  'B+': 'text-blue-400',
  'B': 'text-blue-400',
  'C+': 'text-yellow-400',
  'C': 'text-yellow-400',
  'D': 'text-orange-400',
  'F': 'text-red-400',
};

const MOOD_COLORS: Record<string, string> = {
  positive: 'text-green-400 bg-green-500/10',
  neutral: 'text-gray-400 bg-gray-500/10',
  negative: 'text-red-400 bg-red-500/10',
  mixed: 'text-yellow-400 bg-yellow-500/10',
};

interface SentimentSnapshot {
  symbol: string;
  mood: string;
  summary: string;
}

export function MonthlyReportCard({ report }: MonthlyReportCardProps) {
  const gradeColor = GRADE_COLORS[report.overallGrade] || 'text-gray-400';
  const [sentimentContext, setSentimentContext] = useState<SentimentSnapshot[]>([]);

  useEffect(() => {
    // Fetch sentiment for symbols mentioned in report patterns (best effort)
    fetchSentimentContext();
  }, [report]);

  const fetchSentimentContext = async () => {
    try {
      // Use batch endpoint for common traded symbols
      const symbols = [
        { symbol: 'SPY', name: 'S&P 500 ETF' },
        { symbol: 'QQQ', name: 'Nasdaq ETF' },
      ];
      const resp = await fetch(API_ENDPOINTS.sentiment.batch, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });
      const data = await resp.json();
      const snapshots: SentimentSnapshot[] = [];
      for (const [sym, val] of Object.entries(data.sentiments || {})) {
        const s = val as any;
        if (s.mood) {
          snapshots.push({ symbol: sym, mood: s.mood, summary: s.summary || '' });
        }
      }
      setSentimentContext(snapshots);
    } catch {
      // Non-blocking
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div suppressHydrationWarning className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(report.periodStart).toLocaleDateString()} — {new Date(report.periodEnd).toLocaleDateString()}
          </div>
        </div>
        <div className={`text-4xl font-bold ${gradeColor}`}>
          {report.overallGrade}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-5 gap-2">
        {(['risk', 'discipline', 'strategy', 'psychology', 'consistency'] as const).map(key => (
          <div key={key} className="text-center glass-card rounded-lg p-2">
            <div className="text-lg font-bold">{report.scores[key]?.toFixed(0) || '0'}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{key}</div>
          </div>
        ))}
      </div>

      {/* Market Context */}
      {sentimentContext.length > 0 && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs font-medium text-teal-400 mb-2">Market Context</div>
          <div className="space-y-2">
            {sentimentContext.map(s => (
              <div key={s.symbol} className="flex items-start gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${MOOD_COLORS[s.mood] || MOOD_COLORS.neutral}`}>
                  {s.mood}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{s.symbol}</span>
                  {s.summary && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                      {s.summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-2">
            Sentiment is descriptive only and does not indicate future direction.
          </p>
        </div>
      )}

      {/* Gemini Summary */}
      {report.geminiSummary && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs font-medium text-brand-400 mb-2">AI Summary</div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {report.geminiSummary}
          </p>
        </div>
      )}

      {/* Patterns */}
      {report.patternsDetected.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Patterns Detected</div>
          <div className="flex flex-wrap gap-1.5">
            {report.patternsDetected.map(p => (
              <span key={p} className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500">
                {p.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Badge updates */}
      {report.badgeUpdates.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Badge Status</div>
          <div className="flex flex-wrap gap-1.5">
            {report.badgeUpdates.map(bu => (
              <span
                key={bu.badgeType}
                className={`text-xs px-2 py-1 rounded-full ${
                  bu.change === 'earned' ? 'bg-green-500/10 text-green-400' :
                  bu.change === 'lost' ? 'bg-red-500/10 text-red-400' :
                  'bg-gray-500/10 text-gray-400'
                }`}
              >
                {bu.badgeType.replace(/_/g, ' ')} — {bu.change}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
