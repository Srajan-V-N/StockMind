'use client';

import { useChallenges } from '@/contexts/ChallengesContext';
import { ChallengeCard } from './ChallengeCard';
import { Button } from '@/components/ui/button';

export function ChallengesPanel() {
  const { activeChallenges, completedChallenges, isLoading, refreshChallenges } = useChallenges();

  return (
    <div className="space-y-6">
      {/* Active Challenges */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Active Challenges</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Complete missions to improve your trading skills
              </p>
            </div>
          </div>
          <Button variant="glass" size="sm" onClick={refreshChallenges} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {activeChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeChallenges.map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No active challenges.</p>
            <p className="text-xs mt-1">Challenges refresh automatically.</p>
          </div>
        )}
      </div>

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-4">Completed Challenges</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedChallenges.map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
