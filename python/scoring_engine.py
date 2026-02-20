"""
Scoring Engine: Computes 30-day rolling performance scores,
manages badge progression, generates monthly reports.
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import statistics

# Import Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


# Badge definitions: score dimension, threshold, required qualifying days out of 30
BADGE_DEFINITIONS = {
    'risk_guardian': {'score': 'risk', 'threshold': 75, 'days': 21},
    'discipline_master': {'score': 'discipline', 'threshold': 80, 'days': 21},
    'consistency_pro': {'score': 'consistency', 'threshold': 70, 'days': 21},
    'strategy_builder': {'score': 'strategy', 'threshold': 70, 'days': 21},
    'psychology_champion': {'score': 'psychology', 'threshold': 75, 'days': 21},
    'market_aware': {'score': 'psychology', 'threshold': 70, 'days': 21, 'requires_sentiment': True},
}

BADGE_LABELS = {
    'risk_guardian': 'Risk Guardian',
    'discipline_master': 'Discipline Master',
    'consistency_pro': 'Consistency Pro',
    'strategy_builder': 'Strategy Builder',
    'psychology_champion': 'Psychology Champion',
    'market_aware': 'Market Aware',
}

SCORE_LABELS = {
    'risk': 'Risk Management',
    'discipline': 'Discipline',
    'strategy': 'Strategy',
    'psychology': 'Psychology',
    'consistency': 'Consistency',
}


def compute_risk_score(holdings: List[Dict], balance: float) -> float:
    """Position diversity + cash reserve + max single-position exposure."""
    total_value = balance
    position_values = []
    for h in holdings:
        qty = h.get('quantity', 0)
        price = h.get('currentPrice', h.get('averagePrice', 0))
        val = qty * price
        position_values.append(val)
        total_value += val

    if total_value <= 0:
        return 50.0  # Neutral if no portfolio

    score = 100.0

    # Penalize low number of holdings (diversity)
    num_holdings = len(holdings)
    if num_holdings < 3:
        score -= (3 - num_holdings) * 15  # -15 per missing holding below 3

    # Penalize low cash reserve (<10%)
    cash_pct = (balance / total_value) * 100
    if cash_pct < 10:
        score -= (10 - cash_pct) * 2

    # Penalize over-concentration (any position >25%)
    for val in position_values:
        pct = (val / total_value) * 100
        if pct > 25:
            score -= (pct - 25) * 1.5

    return max(0.0, min(100.0, score))


def compute_discipline_score(checklists: List[Dict], trade_count: int) -> float:
    """Based on checklist completion rate and average items checked."""
    if trade_count == 0:
        return 50.0

    total_checklists = len(checklists)
    if total_checklists == 0:
        return 20.0  # No checklists at all = poor discipline

    full_completions = sum(1 for c in checklists if c.get('completed_count', 0) == 5 and not c.get('skipped', False))
    avg_items = sum(c.get('completed_count', 0) for c in checklists) / total_checklists
    skips = sum(1 for c in checklists if c.get('skipped', False))

    completion_ratio = full_completions / total_checklists if total_checklists > 0 else 0
    score = completion_ratio * 60 + (avg_items / 5) * 40

    # Penalize skips
    skip_ratio = skips / total_checklists if total_checklists > 0 else 0
    score -= skip_ratio * 20

    return max(0.0, min(100.0, score))


def compute_strategy_score(transactions: List[Dict]) -> float:
    """Win rate, profit/loss ratio, holding duration distribution."""
    sells = [t for t in transactions if t.get('action') == 'sell']
    buys = [t for t in transactions if t.get('action') == 'buy']

    if not sells:
        return 40.0  # No sells = can't evaluate strategy yet

    # Compute wins vs losses from sell transactions
    wins = 0
    losses = 0
    total_profit = 0.0
    total_loss = 0.0

    # Match sells to buys for the same symbol
    buy_map: Dict[str, List[Dict]] = {}
    for b in buys:
        sym = b.get('symbol', '')
        if sym not in buy_map:
            buy_map[sym] = []
        buy_map[sym].append(b)

    for sell in sells:
        sym = sell.get('symbol', '')
        sell_price = sell.get('price', 0)
        # Find avg buy price for this symbol
        sym_buys = buy_map.get(sym, [])
        if not sym_buys:
            continue
        avg_buy = sum(b.get('price', 0) for b in sym_buys) / len(sym_buys)

        if sell_price > avg_buy:
            wins += 1
            total_profit += (sell_price - avg_buy) * sell.get('quantity', 0)
        else:
            losses += 1
            total_loss += (avg_buy - sell_price) * sell.get('quantity', 0)

    total_trades = wins + losses
    if total_trades == 0:
        return 40.0

    win_rate = wins / total_trades
    pl_ratio = (total_profit / total_loss) if total_loss > 0 else 2.0
    pl_ratio = min(pl_ratio, 3.0)  # Cap at 3

    # Holding duration score: prefer holding > 1 day
    duration_score = 50.0  # Default middle
    durations = []
    for sell in sells:
        sym = sell.get('symbol', '')
        sell_ts = _parse_timestamp(sell.get('timestamp', ''))
        sym_buys = buy_map.get(sym, [])
        if sell_ts and sym_buys:
            buy_ts = _parse_timestamp(sym_buys[0].get('timestamp', ''))
            if buy_ts:
                days = (sell_ts - buy_ts).total_seconds() / 86400
                durations.append(days)

    if durations:
        avg_duration = sum(durations) / len(durations)
        if avg_duration >= 3:
            duration_score = 80.0
        elif avg_duration >= 1:
            duration_score = 60.0
        else:
            duration_score = 30.0

    score = win_rate * 40 + (pl_ratio / 3.0) * 30 + (duration_score / 100) * 30
    return max(0.0, min(100.0, score * 100 / 100))


def compute_psychology_score(mentor_triggers: List[Dict]) -> float:
    """Start at 100, subtract per pattern type."""
    score = 100.0
    deductions = {
        'fomo_buy': 10,
        'panic_sell': 15,
        'overtrading': 10,
    }
    for trigger in mentor_triggers:
        pattern = trigger.get('pattern_type', '')
        score -= deductions.get(pattern, 5)

    return max(0.0, min(100.0, score))


def compute_consistency_score(
    daily_scores_history: List[Dict],
    active_days: int,
    total_days: int = 30,
) -> float:
    """Active days ratio, score stability, no big drawdown days."""
    if total_days == 0:
        return 50.0

    # Active days ratio (50% weight)
    active_ratio = min(active_days / total_days, 1.0)
    active_component = active_ratio * 50

    # Score stability - low variance across all score dimensions (30% weight)
    stability_component = 30.0  # Default if not enough data
    if len(daily_scores_history) >= 3:
        all_scores = []
        for ds in daily_scores_history:
            for key in ['risk_score', 'discipline_score', 'strategy_score', 'psychology_score']:
                val = ds.get(key, 0)
                if val > 0:
                    all_scores.append(val)
        if len(all_scores) >= 3:
            variance = statistics.variance(all_scores)
            # Lower variance = higher stability
            stability = max(0, 100 - variance / 5)
            stability_component = (stability / 100) * 30

    # No big drawdown days (20% weight) - check if any day had all scores < 30
    drawdown_days = 0
    for ds in daily_scores_history:
        avg = sum(ds.get(k, 50) for k in ['risk_score', 'discipline_score', 'strategy_score', 'psychology_score']) / 4
        if avg < 30:
            drawdown_days += 1

    drawdown_ratio = drawdown_days / max(len(daily_scores_history), 1)
    drawdown_component = (1 - drawdown_ratio) * 20

    return max(0.0, min(100.0, active_component + stability_component + drawdown_component))


def check_eligibility(trade_count: int, active_days: int) -> bool:
    """Eligible if >=25 trades OR >=15 active days in 30-day window."""
    return trade_count >= 25 or active_days >= 15


def compute_data_sufficiency(
    holdings: List[Dict],
    checklists: List[Dict],
    transactions: List[Dict],
    mentor_triggers: List[Dict],
    daily_scores_history: List[Dict],
    trade_count: int,
) -> Dict[str, bool]:
    """Check if there is sufficient data for each scoring dimension.
    Returns True if data is INSUFFICIENT (not enough data)."""
    sells = [t for t in transactions if t.get('action') == 'sell']
    return {
        'risk': len(holdings) == 0,
        'discipline': trade_count == 0 or len(checklists) == 0,
        'strategy': len(sells) == 0,
        'psychology': trade_count == 0,
        'consistency': len(daily_scores_history) < 3,
    }


def compute_all_scores(
    holdings: List[Dict],
    balance: float,
    checklists: List[Dict],
    transactions: List[Dict],
    mentor_triggers: List[Dict],
    daily_scores_history: List[Dict],
    active_days: int,
    trade_count: int,
) -> Dict[str, Any]:
    """Compute all 5 scores and eligibility."""
    eligible = check_eligibility(trade_count, active_days)

    risk = compute_risk_score(holdings, balance)
    discipline = compute_discipline_score(checklists, trade_count)
    strategy = compute_strategy_score(transactions)
    psychology = compute_psychology_score(mentor_triggers)
    consistency = compute_consistency_score(daily_scores_history, active_days)

    insufficient_data = compute_data_sufficiency(
        holdings, checklists, transactions, mentor_triggers,
        daily_scores_history, trade_count,
    )

    return {
        'risk': round(risk, 1),
        'discipline': round(discipline, 1),
        'strategy': round(strategy, 1),
        'psychology': round(psychology, 1),
        'consistency': round(consistency, 1),
        'eligible': eligible,
        'trade_count': trade_count,
        'active_days': active_days,
        'insufficient_data': insufficient_data,
    }


def evaluate_badges(daily_scores: List[Dict], mentor_triggers: Optional[List[Dict]] = None) -> List[Dict]:
    """Evaluate badge status based on last 30 days of daily scores."""
    results = []
    for badge_type, defn in BADGE_DEFINITIONS.items():
        score_key = f"{defn['score']}_score"
        threshold = defn['threshold']
        required_days = defn['days']

        qualifying_days = sum(
            1 for ds in daily_scores
            if ds.get(score_key, 0) >= threshold
        )

        earned = qualifying_days >= required_days

        # Special condition for market_aware: no sentiment_fomo triggers in the window
        if defn.get('requires_sentiment') and earned and mentor_triggers is not None:
            fomo_count = sum(
                1 for t in mentor_triggers
                if t.get('pattern_type') == 'sentiment_fomo'
            )
            if fomo_count > 0:
                earned = False

        results.append({
            'badge_type': badge_type,
            'earned': earned,
            'active': earned,
            'qualifying_days': qualifying_days,
            'required_days': required_days,
        })

    return results


def compute_overall_grade(scores: Dict[str, float]) -> str:
    """Compute letter grade from average of all scores."""
    avg = sum(scores.get(k, 0) for k in ['risk', 'discipline', 'strategy', 'psychology', 'consistency']) / 5

    if avg >= 90:
        return 'A+'
    elif avg >= 80:
        return 'A'
    elif avg >= 70:
        return 'B+'
    elif avg >= 60:
        return 'B'
    elif avg >= 50:
        return 'C+'
    elif avg >= 40:
        return 'C'
    elif avg >= 30:
        return 'D'
    else:
        return 'F'


async def generate_report_summary(
    scores: Dict[str, float],
    grade: str,
    patterns: List[str],
    best_trade: Optional[Dict],
    worst_trade: Optional[Dict],
    trend_data: Optional[Dict] = None,
    pattern_frequency: Optional[Dict[str, int]] = None,
    checklist_stats: Optional[Dict] = None,
    trade_stats: Optional[Dict] = None,
    sentiment_context: Optional[str] = None,
) -> str:
    """Generate Gemini summary for monthly report."""
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
        return f"Overall grade: {grade}. Keep practicing to improve your trading skills."

    try:
        model = genai.GenerativeModel('gemini-2.0-flash-lite')

        # Build enrichment sections
        trend_section = ""
        if trend_data:
            current = trend_data.get('current', {})
            previous = trend_data.get('previous', {})
            if current or previous:
                lines = []
                for dim in ['risk', 'discipline', 'strategy', 'psychology', 'consistency']:
                    c = current.get(dim, 0)
                    p = previous.get(dim, 0)
                    diff = c - p
                    arrow = "↑" if diff > 0 else ("↓" if diff < 0 else "→")
                    lines.append(f"  {dim.title()}: {c:.0f} (prev: {p:.0f}, {arrow}{abs(diff):.0f})")
                trend_section = "\nScore Trends (current vs previous 30 days):\n" + "\n".join(lines)

        pattern_section = ""
        if pattern_frequency:
            items = [f"  {pt}: {count}x" for pt, count in pattern_frequency.items()]
            if items:
                pattern_section = "\nPattern Frequency (30 days):\n" + "\n".join(items)

        checklist_section = ""
        if checklist_stats:
            checklist_section = f"""
Checklist Statistics (30 days):
  Total checklists: {checklist_stats.get('totalChecklists', 0)}
  Completion rate: {checklist_stats.get('completionRate', 0)}%
  Skip rate: {checklist_stats.get('skipRate', 0)}%
  Avg items checked: {checklist_stats.get('averageItemsChecked', 0)}/5"""

        trade_section = ""
        if trade_stats:
            trade_section = f"""
Trade Statistics (30 days):
  Total trades: {trade_stats.get('total', 0)}
  Buys: {trade_stats.get('buys', 0)}, Sells: {trade_stats.get('sells', 0)}
  Avg holding duration: {trade_stats.get('avgHoldingDays', 'N/A')} days"""

        sentiment_section = ""
        if sentiment_context:
            sentiment_section = f"""
Market Context (sentiment during this period):
{sentiment_context}
Note: Sentiment data is descriptive only — do not predict future movement."""

        prompt = f"""You are an educational trading mentor reviewing a student's monthly performance.

Scores (0-100):
- Risk Management: {scores.get('risk', 0):.0f}
- Discipline: {scores.get('discipline', 0):.0f}
- Strategy: {scores.get('strategy', 0):.0f}
- Psychology: {scores.get('psychology', 0):.0f}
- Consistency: {scores.get('consistency', 0):.0f}

Overall Grade: {grade}
Patterns Detected: {', '.join(patterns) if patterns else 'None'}
Best Trade: {best_trade.get('symbol', 'N/A') if best_trade else 'N/A'}
Worst Trade: {worst_trade.get('symbol', 'N/A') if worst_trade else 'N/A'}
{trend_section}{pattern_section}{checklist_section}{trade_section}{sentiment_section}

Write a comprehensive but concise (5-7 sentences) educational summary of this month's performance.
Highlight strengths, areas for improvement, comment on trends if data is available,
and give 1-2 actionable tips for the next month.
Do NOT give buy/sell advice or predict prices.
Do NOT suggest specific trades. Keep it educational and encouraging."""

        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini report summary error: {e}")
        return f"Overall grade: {grade}. Keep practicing to improve your trading skills."


async def compute_trader_profile(
    scores: Optional[Dict],
    badges: List[Dict],
    transactions: List[Dict],
    active_days: int,
    challenges_completed: int,
) -> Dict[str, Any]:
    """Compute trader profile summary."""
    # Skill level from average score
    if scores:
        avg = sum(scores.get(k, 0) for k in ['risk', 'discipline', 'strategy', 'psychology', 'consistency']) / 5
    else:
        avg = 0

    if avg >= 80:
        skill_level = 'Expert'
    elif avg >= 60:
        skill_level = 'Advanced'
    elif avg >= 40:
        skill_level = 'Intermediate'
    else:
        skill_level = 'Beginner'

    # Strengths and weaknesses
    score_dims = ['risk', 'discipline', 'strategy', 'psychology', 'consistency']
    if scores:
        sorted_dims = sorted(score_dims, key=lambda k: scores.get(k, 0), reverse=True)
        strengths = [SCORE_LABELS.get(d, d) for d in sorted_dims[:2]]
        weaknesses = [SCORE_LABELS.get(d, d) for d in sorted_dims[-2:]]
    else:
        strengths = []
        weaknesses = []

    # Win rate from transactions
    sells = [t for t in transactions if t.get('action') == 'sell']
    buys_map: Dict[str, float] = {}
    for b in transactions:
        if b.get('action') == 'buy':
            sym = b.get('symbol', '')
            if sym not in buys_map:
                buys_map[sym] = b.get('price', 0)

    wins = 0
    for s in sells:
        sym = s.get('symbol', '')
        buy_price = buys_map.get(sym, 0)
        if buy_price > 0 and s.get('price', 0) > buy_price:
            wins += 1

    win_rate = (wins / len(sells) * 100) if sells else 0

    active_badges = [b for b in badges if b.get('active', False)]

    return {
        'skillLevel': skill_level,
        'activeBadges': active_badges,
        'currentScores': scores,
        'strengths': strengths,
        'weaknesses': weaknesses,
        'totalTrades': len(transactions),
        'activeDays': active_days,
        'winRate': round(win_rate, 1),
        'challengesCompleted': challenges_completed,
    }


def compute_behavior_summary(
    all_scores: List[Dict],
    trigger_counts: Dict[str, int],
) -> Dict[str, Any]:
    """Compute long-term behavior tracking summary from all-time data."""
    total_scored_days = len(all_scores)
    first_score_date = all_scores[0].get('date') if all_scores else None

    score_dims = ['risk', 'discipline', 'strategy', 'psychology', 'consistency']
    score_keys = [f'{d}_score' for d in score_dims]

    # Split into current 30 days and previous 30 days
    now = datetime.utcnow().date()
    cutoff_current = (now - timedelta(days=30)).isoformat()
    cutoff_previous = (now - timedelta(days=60)).isoformat()

    current_window = [s for s in all_scores if s.get('date', '') >= cutoff_current]
    previous_window = [s for s in all_scores if cutoff_previous <= s.get('date', '') < cutoff_current]

    def avg_for_window(window: List[Dict]) -> Dict[str, float]:
        result = {}
        for dim, key in zip(score_dims, score_keys):
            vals = [s.get(key, 0) for s in window if s.get(key, 0) > 0]
            result[dim] = round(sum(vals) / len(vals), 1) if vals else 0
        return result

    current_avg = avg_for_window(current_window)
    previous_avg = avg_for_window(previous_window)

    # Improvement trend per dimension (±5 threshold)
    improvement_trend = {}
    for dim in score_dims:
        diff = current_avg.get(dim, 0) - previous_avg.get(dim, 0)
        if diff > 5:
            improvement_trend[dim] = 'improving'
        elif diff < -5:
            improvement_trend[dim] = 'declining'
        else:
            improvement_trend[dim] = 'stable'

    # Streaks: consecutive days with avg score >= 60
    longest_streak = 0
    current_streak = 0
    for s in all_scores:
        avg_score = sum(s.get(k, 0) for k in score_keys) / len(score_keys)
        if avg_score >= 60:
            current_streak += 1
            longest_streak = max(longest_streak, current_streak)
        else:
            current_streak = 0

    return {
        'triggerTotals': trigger_counts,
        'currentAvg': current_avg,
        'previousAvg': previous_avg,
        'improvementTrend': improvement_trend,
        'longestStreak': longest_streak,
        'currentStreak': current_streak,
        'totalScoredDays': total_scored_days,
        'firstScoreDate': first_score_date,
    }


def _parse_timestamp(ts: str) -> Optional[datetime]:
    """Parse ISO timestamp string."""
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace('Z', '+00:00').replace('+00:00', ''))
    except (ValueError, TypeError):
        return None
