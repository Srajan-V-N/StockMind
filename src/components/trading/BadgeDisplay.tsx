'use client';

import { Badge } from '@/types/mentor';

const BADGE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  risk_guardian: { icon: '🛡️', color: 'from-blue-500 to-cyan-500', label: 'Risk Guardian' },
  discipline_master: { icon: '🎯', color: 'from-green-500 to-emerald-500', label: 'Discipline Master' },
  consistency_pro: { icon: '📊', color: 'from-purple-500 to-violet-500', label: 'Consistency Pro' },
  strategy_builder: { icon: '🧠', color: 'from-orange-500 to-amber-500', label: 'Strategy Builder' },
  psychology_champion: { icon: '💪', color: 'from-pink-500 to-rose-500', label: 'Psychology Champion' },
  market_aware: { icon: '📰', color: 'from-teal-500 to-cyan-500', label: 'Market Aware' },
};

interface BadgeDisplayProps {
  badges: Badge[];
}

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {badges.map(badge => {
        const config = BADGE_CONFIG[badge.badgeType] || {
          icon: '🏆',
          color: 'from-gray-500 to-gray-600',
          label: badge.badgeType,
        };
        const progress = Math.min((badge.qualifyingDays / badge.requiredDays) * 100, 100);

        return (
          <div
            key={badge.badgeType}
            className={`glass-card rounded-xl p-4 text-center transition-all ${
              badge.earned ? 'ring-2 ring-yellow-400/50' : 'opacity-70'
            }`}
          >
            <div className={`text-3xl mb-2 ${badge.earned ? '' : 'grayscale opacity-50'}`}>
              {config.icon}
            </div>
            <div className="text-xs font-semibold mb-2 leading-tight">{config.label}</div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${config.color} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {badge.qualifyingDays}/{badge.requiredDays} days
            </div>

            {badge.earned && (
              <div className="mt-1 text-[10px] text-yellow-500 font-medium">Earned</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
