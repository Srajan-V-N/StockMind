'use client';

import { useState, useEffect } from 'react';
import { TraderProfile as TraderProfileType } from '@/types/mentor';
import { API_ENDPOINTS } from '@/lib/constants';
import { BadgeDisplay } from './BadgeDisplay';

const SKILL_COLORS: Record<string, string> = {
  Beginner: 'text-gray-400',
  Intermediate: 'text-blue-400',
  Advanced: 'text-purple-400',
  Expert: 'text-yellow-400',
};

export function TraderProfile() {
  const [profile, setProfile] = useState<TraderProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(API_ENDPOINTS.evaluation.profile, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile || null);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">Profile unavailable. Start trading to build your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <div className={`text-2xl font-bold ${SKILL_COLORS[profile.skillLevel]}`}>
              {profile.skillLevel}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Trader Level</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{profile.totalTrades}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Trades</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{profile.activeDays}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Active Days</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{profile.winRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{profile.challengesCompleted}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Challenges Done</div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="text-green-400">▲</span> Strengths
          </h4>
          {profile.strengths.length > 0 ? (
            <div className="space-y-2">
              {profile.strengths.map(s => (
                <div key={s} className="text-sm px-3 py-2 rounded-lg bg-green-500/10 text-green-400">
                  {s}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Not enough data yet.</p>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="text-orange-400">▼</span> Areas to Improve
          </h4>
          {profile.weaknesses.length > 0 ? (
            <div className="space-y-2">
              {profile.weaknesses.map(w => (
                <div key={w} className="text-sm px-3 py-2 rounded-lg bg-orange-500/10 text-orange-400">
                  {w}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Not enough data yet.</p>
          )}
        </div>
      </div>

      {/* Active Badges */}
      {profile.activeBadges && profile.activeBadges.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h4 className="font-semibold text-sm mb-3">Active Badges</h4>
          <BadgeDisplay badges={profile.activeBadges} />
        </div>
      )}
    </div>
  );
}
