'use client';

import { useEvaluation } from '@/contexts/EvaluationContext';
import { ScoreRadarChart } from './ScoreRadarChart';
import { BadgeDisplay } from './BadgeDisplay';
import { MonthlyReportCard } from './MonthlyReportCard';
import { Button } from '@/components/ui/button';

export function EvaluationDashboard() {
  const { scores, badges, isEligible, isLoading, refreshScores, generateReport, latestReport } = useEvaluation();

  return (
    <div className="space-y-6">
      {/* Eligibility Banner */}
      {!isEligible && (
        <div className="glass-card rounded-2xl p-4 border border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <span className="font-medium">Not yet eligible for full scoring.</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                Complete 25+ trades or be active for 15+ days in the last 30 days.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scores Section */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Performance Scores</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">30-day rolling evaluation</p>
          </div>
          <Button variant="glass" size="sm" onClick={refreshScores} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {scores ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ScoreRadarChart scores={scores} />
            <div className="space-y-3">
              {(['risk', 'discipline', 'strategy', 'psychology', 'consistency'] as const).map(key => {
                const value = scores[key] as number;
                const colors = {
                  risk: 'bg-blue-500',
                  discipline: 'bg-green-500',
                  strategy: 'bg-orange-500',
                  psychology: 'bg-pink-500',
                  consistency: 'bg-purple-500',
                };
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{key}</span>
                      <span className="font-semibold">{typeof value === 'number' ? value.toFixed(0) : '0'}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[key]} transition-all duration-500`}
                        style={{ width: `${typeof value === 'number' ? Math.min(value, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No scores computed yet.</p>
            <p className="text-xs mt-1">Start trading to see your performance evaluation.</p>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">Skill Badges</h3>
        {badges.length > 0 ? (
          <BadgeDisplay badges={badges} />
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
            Badges will appear after your first score computation.
          </div>
        )}
      </div>

      {/* Monthly Report */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Monthly Report</h3>
          <Button variant="glass" size="sm" onClick={generateReport} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
        {latestReport ? (
          <MonthlyReportCard report={latestReport} />
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
            No reports generated yet. Click &quot;Generate Report&quot; to create one.
          </div>
        )}
      </div>
    </div>
  );
}
