import { Transaction } from './trading';

// ============================================================================
// TRADE CHECKLIST TYPES
// ============================================================================

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
}

export interface ChecklistState {
  items: Record<string, boolean>;
  skipped: boolean;
}

export interface ChecklistRecord {
  id: string;
  transactionId: string;
  symbol: string;
  type: 'stock' | 'crypto';
  action: 'buy' | 'sell';
  items: Record<string, boolean>;
  skipped: boolean;
  completedCount: number;
  createdAt: string;
}

export interface ChecklistStats {
  totalChecklists: number;
  completionRate: number;
  skipRate: number;
  averageItemsChecked: number;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'company_understood', label: 'I understand this company/asset', description: 'Reviewed what this company does and how it makes money' },
  { id: 'chart_reviewed', label: 'I have reviewed the price chart', description: 'Looked at recent price history and trends' },
  { id: 'position_size', label: 'Position size is appropriate', description: 'This trade does not overweight your portfolio in one asset' },
  { id: 'exit_plan', label: 'I have an exit plan', description: 'Know at what price or condition you would sell' },
  { id: 'risk_acceptable', label: 'Risk is acceptable', description: 'Comfortable with the potential downside of this trade' },
];

// ============================================================================
// MENTOR ALERT TYPES
// ============================================================================

export interface MentorAlert {
  id: string;
  patternType: string;
  severity: 'info' | 'warning' | 'critical';
  symbol: string | null;
  message: string;
  geminiFeedback: string | null;
  dismissed: boolean;
  createdAt: string;
  escalationLevel?: 'first' | 'recurring' | 'persistent';
  priorCount?: number;
  escalationNote?: string;
}

// ============================================================================
// EVALUATION / SCORING TYPES
// ============================================================================

export interface DailyScores {
  date: string;
  risk: number;
  discipline: number;
  strategy: number;
  psychology: number;
  consistency: number;
  eligible: boolean;
  insufficientData?: Record<string, boolean>;
}

export type BadgeType = 'risk_guardian' | 'discipline_master' | 'consistency_pro' | 'strategy_builder' | 'psychology_champion' | 'market_aware';

export interface Badge {
  id: string;
  badgeType: BadgeType;
  earned: boolean;
  active: boolean;
  qualifyingDays: number;
  requiredDays: number;
  firstEarnedAt: string | null;
}

export interface MonthlyReport {
  id: string;
  periodStart: string;
  periodEnd: string;
  scores: {
    risk: number;
    discipline: number;
    strategy: number;
    psychology: number;
    consistency: number;
  };
  overallGrade: string;
  bestTrade: Transaction | null;
  worstTrade: Transaction | null;
  patternsDetected: string[];
  geminiSummary: string;
  badgeUpdates: { badgeType: BadgeType; change: 'earned' | 'lost' | 'maintained' }[];
  createdAt: string;
}

// ============================================================================
// CHALLENGE TYPES
// ============================================================================

export interface Challenge {
  id: string;
  challengeType: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  status: 'active' | 'completed' | 'expired';
  startedAt: string;
  expiresAt: string;
  completedAt: string | null;
}

// ============================================================================
// TRADER PROFILE TYPES
// ============================================================================

export interface TraderProfile {
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  activeBadges: Badge[];
  currentScores: DailyScores | null;
  strengths: string[];
  weaknesses: string[];
  totalTrades: number;
  activeDays: number;
  winRate: number;
  challengesCompleted: number;
}

// ============================================================================
// JOURNAL TYPES
// ============================================================================

export type JournalMood = 'confident' | 'anxious' | 'neutral' | 'frustrated' | 'excited';

export interface JournalEntry {
  id: string;
  transactionId: string | null;
  symbol: string;
  mood: JournalMood;
  note: string;
  createdAt: string;
}

// ============================================================================
// BEHAVIOR SUMMARY TYPES
// ============================================================================

export type ImprovementTrend = 'improving' | 'stable' | 'declining';

export interface BehaviorSummary {
  triggerTotals: Record<string, number>;
  currentAvg: Record<string, number>;
  previousAvg: Record<string, number>;
  improvementTrend: Record<string, ImprovementTrend>;
  longestStreak: number;
  currentStreak: number;
  totalScoredDays: number;
  firstScoreDate: string | null;
}
