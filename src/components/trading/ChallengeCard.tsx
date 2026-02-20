'use client';

import { Challenge } from '@/types/mentor';

interface ChallengeCardProps {
  challenge: Challenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const isCompleted = challenge.status === 'completed';
  const isExpired = challenge.status === 'expired';
  const timeRemaining = getTimeRemaining(challenge.expiresAt);

  return (
    <div className={`glass-card rounded-xl p-4 transition-all ${
      isCompleted ? 'ring-2 ring-green-500/30' : isExpired ? 'opacity-50' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm">{challenge.title}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{challenge.description}</p>
        </div>
        {isCompleted && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 font-medium flex-shrink-0">
            Completed
          </span>
        )}
        {isExpired && (
          <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 font-medium flex-shrink-0">
            Expired
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500 dark:text-gray-400">Progress</span>
          <span className="font-medium">{challenge.progress.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-green-500' : 'bg-brand-500'
            }`}
            style={{ width: `${challenge.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
          <span>{challenge.currentValue.toFixed(1)} / {challenge.targetValue.toFixed(1)}</span>
          {!isCompleted && !isExpired && timeRemaining && (
            <span>{timeRemaining} remaining</span>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeRemaining(expiresAt: string): string | null {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const diff = expires - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d`;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  return `${hours}h`;
}
