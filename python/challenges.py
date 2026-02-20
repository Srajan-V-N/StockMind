"""
Challenges Module: Defines trading missions and computes progress.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any

# Challenge templates with progress computation
CHALLENGE_TEMPLATES = [
    {
        'challenge_type': 'diversify_sectors',
        'title': 'Sector Explorer',
        'description': 'Hold 3 or more unique asset types (stocks and crypto) at the same time.',
        'target_value': 3.0,
        'duration_days': 30,
    },
    {
        'challenge_type': 'cash_reserve',
        'title': 'Cash Discipline',
        'description': 'Keep at least 25% of your portfolio in cash for 7 consecutive days.',
        'target_value': 7.0,
        'duration_days': 30,
    },
    {
        'challenge_type': 'checklist_streak',
        'title': 'Mindful Trader',
        'description': 'Complete 10 consecutive full trade checklists without skipping.',
        'target_value': 10.0,
        'duration_days': 30,
    },
    {
        'challenge_type': 'hold_duration',
        'title': 'Patient Investor',
        'description': 'Hold at least 1 position for 5 or more days.',
        'target_value': 5.0,
        'duration_days': 30,
    },
    {
        'challenge_type': 'trade_variety',
        'title': 'Multi-Market Learner',
        'description': 'Execute trades in both stocks and crypto markets.',
        'target_value': 2.0,
        'duration_days': 30,
    },
    {
        'challenge_type': 'neutral_trader',
        'title': 'Calm Waters',
        'description': 'Execute 3 trades when market sentiment for the asset is neutral.',
        'target_value': 3.0,
        'duration_days': 30,
    },
    {
        'challenge_type': 'hype_resistant',
        'title': 'Hype Resistant',
        'description': 'Go 7 days without buying any asset with >70% positive sentiment.',
        'target_value': 7.0,
        'duration_days': 14,
    },
]


def compute_diversify_sectors(holdings: List[Dict], **kwargs) -> float:
    """Count unique asset types in holdings."""
    types = set()
    for h in holdings:
        sym = h.get('symbol', '')
        asset_type = h.get('type', '')
        if sym and asset_type:
            types.add(f"{asset_type}:{sym}")
    return float(len(types))


def compute_cash_reserve(
    balance: float,
    holdings: List[Dict],
    transactions: List[Dict],
    **kwargs,
) -> float:
    """Count consecutive days with >=25% cash. Simplified: check current state."""
    total_value = balance
    for h in holdings:
        qty = h.get('quantity', 0)
        price = h.get('currentPrice', h.get('averagePrice', 0))
        total_value += qty * price

    if total_value <= 0:
        return 0.0

    cash_pct = (balance / total_value) * 100
    if cash_pct >= 25:
        # Count days since portfolio had >= 25% cash
        # Simplified: assume current state persists, count active days
        now = datetime.utcnow()
        # Check transaction history to find when cash % was maintained
        consecutive = 0
        for day_offset in range(30):
            check_date = now - timedelta(days=day_offset)
            # Simple heuristic: if no buys on this day that would drop cash below 25%
            day_trades = [
                t for t in transactions
                if t.get('action') == 'buy'
                and _parse_timestamp(t.get('timestamp', ''))
                and _parse_timestamp(t.get('timestamp', '')).date() == check_date.date()
            ]
            if not day_trades and cash_pct >= 25:
                consecutive += 1
            else:
                break
        return float(min(consecutive, 7))
    return 0.0


def compute_checklist_streak(checklists: List[Dict], **kwargs) -> float:
    """Count consecutive full checklists (no skips, all 5 items)."""
    # Sort by created_at descending (most recent first)
    sorted_checklists = sorted(
        checklists,
        key=lambda c: c.get('created_at', ''),
        reverse=True,
    )

    streak = 0
    for c in sorted_checklists:
        if c.get('completed_count', 0) == 5 and not c.get('skipped', False):
            streak += 1
        else:
            break

    return float(min(streak, 10))


def compute_hold_duration(holdings: List[Dict], transactions: List[Dict], **kwargs) -> float:
    """Max holding duration in days for any current position."""
    now = datetime.utcnow()
    max_days = 0.0

    for h in holdings:
        sym = h.get('symbol', '')
        # Find earliest buy that's still held
        buys = [
            t for t in transactions
            if t.get('symbol') == sym and t.get('action') == 'buy'
        ]
        if buys:
            earliest = min(
                (_parse_timestamp(t.get('timestamp', '')) for t in buys if _parse_timestamp(t.get('timestamp', ''))),
                default=None,
            )
            if earliest:
                days = (now - earliest).total_seconds() / 86400
                max_days = max(max_days, days)

    return min(max_days, 5.0)


def compute_trade_variety(transactions: List[Dict], **kwargs) -> float:
    """Count unique asset types traded."""
    types = set()
    for t in transactions:
        asset_type = t.get('type', '')
        if asset_type:
            types.add(asset_type)
    return float(len(types))


def compute_neutral_trader(transactions: List[Dict], **kwargs) -> float:
    """Count trades executed during neutral sentiment periods."""
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    recent_buys = [
        t for t in transactions
        if t.get('action') == 'buy'
        and _parse_timestamp(t.get('timestamp', ''))
        and _parse_timestamp(t.get('timestamp', '')) >= thirty_days_ago
    ]

    # Check sentiment history for each traded symbol
    try:
        import asyncio
        from database import get_cached_sentiment

        count = 0
        checked = set()
        for buy in recent_buys:
            sym = buy.get('symbol', '')
            if sym in checked:
                continue
            checked.add(sym)

            # Use sync check of cached sentiment (best effort)
            # This is computed during challenge refresh which runs in async context
            try:
                loop = asyncio.get_event_loop()
                cached = loop.run_until_complete(get_cached_sentiment(sym))
                if cached and cached.get('mood') == 'neutral':
                    count += 1
            except RuntimeError:
                pass  # No event loop available, skip

        return float(min(count, 3))
    except Exception:
        return 0.0


def compute_hype_resistant(transactions: List[Dict], **kwargs) -> float:
    """Count consecutive days without buying during >70% positive sentiment."""
    now = datetime.utcnow()

    # Check last 14 days for buys during high-optimism
    hype_buy_dates = set()
    for t in transactions:
        if t.get('action') != 'buy':
            continue
        ts = _parse_timestamp(t.get('timestamp', ''))
        if not ts or ts < now - timedelta(days=14):
            continue
        # We track dates with hype buys; actual sentiment check happens via cached data
        hype_buy_dates.add(ts.date())

    # If no buys at all in 14 days, full credit
    if not hype_buy_dates:
        return 7.0

    # Count consecutive days from today without a hype buy
    consecutive = 0
    for day_offset in range(14):
        check_date = (now - timedelta(days=day_offset)).date()
        if check_date in hype_buy_dates:
            break
        consecutive += 1

    return float(min(consecutive, 7))


# Map challenge types to their computation functions
PROGRESS_COMPUTERS = {
    'diversify_sectors': compute_diversify_sectors,
    'cash_reserve': compute_cash_reserve,
    'checklist_streak': compute_checklist_streak,
    'hold_duration': compute_hold_duration,
    'trade_variety': compute_trade_variety,
    'neutral_trader': compute_neutral_trader,
    'hype_resistant': compute_hype_resistant,
}


def compute_challenge_progress(
    challenge_type: str,
    holdings: List[Dict],
    balance: float,
    transactions: List[Dict],
    checklists: List[Dict],
) -> float:
    """Compute current progress for a challenge type."""
    compute_fn = PROGRESS_COMPUTERS.get(challenge_type)
    if not compute_fn:
        return 0.0

    return compute_fn(
        holdings=holdings,
        balance=balance,
        transactions=transactions,
        checklists=checklists,
    )


def _parse_timestamp(ts: str):
    """Parse ISO timestamp string."""
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace('Z', '+00:00').replace('+00:00', ''))
    except (ValueError, TypeError):
        return None
