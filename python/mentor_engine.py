"""
Mentor Engine: Detects behavioral patterns in trading activity
and generates educational feedback using Gemini AI.
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Import Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Pattern definitions
PATTERNS = {
    'fomo_buy': {
        'severity': 'warning',
        'message': 'Possible FOMO detected: You bought {symbol} when its price was significantly above its recent average. Consider reviewing historical price context before buying.',
    },
    'panic_sell': {
        'severity': 'critical',
        'message': 'Possible panic sell: You sold {symbol} at a {loss_pct:.1f}% loss within {hours}h of buying. Quick exits from losses can lock in avoidable losses.',
    },
    'overtrading': {
        'severity': 'warning',
        'message': 'High trading frequency detected: {count} trades in the past 24 hours. Frequent trading can increase transaction costs and emotional decision-making.',
    },
    'over_concentration': {
        'severity': 'warning',
        'message': 'Portfolio concentration alert: {symbol} makes up {pct:.1f}% of your portfolio. Diversification can help manage overall risk.',
    },
    'holding_losers': {
        'severity': 'info',
        'message': 'Extended unrealized loss: {symbol} is down {loss_pct:.1f}% and has been held for {days} days. Consider reviewing your exit plan for this position.',
    },
    'high_risk_position': {
        'severity': 'warning',
        'message': 'Large position size: {symbol} represents {pct:.1f}% of your total portfolio value. Large single positions increase portfolio risk.',
    },
    'sentiment_fomo': {
        'severity': 'warning',
        'message': 'You entered {symbol} during a period of high news optimism ({positive_pct:.0f}% positive sentiment). Such periods can increase volatility and emotional trading.',
    },
}


def detect_fomo_buy(transactions: List[Dict], holdings: List[Dict]) -> List[Dict]:
    """Detect buys when price is >15% above recent average for that symbol."""
    alerts = []
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    # Group transactions by symbol
    symbol_txns: Dict[str, List[Dict]] = {}
    for tx in transactions:
        sym = tx.get('symbol', '')
        if sym not in symbol_txns:
            symbol_txns[sym] = []
        symbol_txns[sym].append(tx)

    # Check recent buys against 30-day average
    for sym, txns in symbol_txns.items():
        prices_30d = []
        recent_buys = []
        for tx in txns:
            ts = _parse_timestamp(tx.get('timestamp', ''))
            if not ts:
                continue
            if ts >= thirty_days_ago:
                prices_30d.append(tx.get('price', 0))
            # Recent buys in last 48h
            if tx.get('action') == 'buy' and ts >= now - timedelta(hours=48):
                recent_buys.append(tx)

        if len(prices_30d) < 3 or not recent_buys:
            continue

        avg_price = sum(prices_30d) / len(prices_30d)
        for buy in recent_buys:
            buy_price = buy.get('price', 0)
            if avg_price > 0 and buy_price > avg_price * 1.15:
                alerts.append({
                    'pattern_type': 'fomo_buy',
                    'severity': 'warning',
                    'symbol': sym,
                    'message': PATTERNS['fomo_buy']['message'].format(symbol=sym),
                })
                break  # One alert per symbol

    return alerts


def detect_panic_sell(transactions: List[Dict]) -> List[Dict]:
    """Detect sells at >10% loss within 48h of buying."""
    alerts = []
    now = datetime.utcnow()

    # Group by symbol
    symbol_txns: Dict[str, List[Dict]] = {}
    for tx in transactions:
        sym = tx.get('symbol', '')
        if sym not in symbol_txns:
            symbol_txns[sym] = []
        symbol_txns[sym].append(tx)

    for sym, txns in symbol_txns.items():
        buys = [t for t in txns if t.get('action') == 'buy']
        sells = [t for t in txns if t.get('action') == 'sell']

        for sell in sells:
            sell_ts = _parse_timestamp(sell.get('timestamp', ''))
            if not sell_ts or sell_ts < now - timedelta(days=7):
                continue  # Only check recent sells

            sell_price = sell.get('price', 0)
            for buy in buys:
                buy_ts = _parse_timestamp(buy.get('timestamp', ''))
                buy_price = buy.get('price', 0)
                if not buy_ts or buy_price <= 0:
                    continue

                hours_diff = (sell_ts - buy_ts).total_seconds() / 3600
                if 0 < hours_diff <= 48:
                    loss_pct = ((sell_price - buy_price) / buy_price) * 100
                    if loss_pct < -10:
                        alerts.append({
                            'pattern_type': 'panic_sell',
                            'severity': 'critical',
                            'symbol': sym,
                            'message': PATTERNS['panic_sell']['message'].format(
                                symbol=sym, loss_pct=abs(loss_pct), hours=int(hours_diff)
                            ),
                        })
                        break
            else:
                continue
            break

    return alerts


def detect_overtrading(transactions: List[Dict]) -> List[Dict]:
    """Detect >5 trades in a 24h window."""
    alerts = []
    now = datetime.utcnow()
    day_ago = now - timedelta(hours=24)

    recent = [
        t for t in transactions
        if _parse_timestamp(t.get('timestamp', '')) and _parse_timestamp(t.get('timestamp', '')) >= day_ago
    ]

    if len(recent) > 5:
        alerts.append({
            'pattern_type': 'overtrading',
            'severity': 'warning',
            'symbol': None,
            'message': PATTERNS['overtrading']['message'].format(count=len(recent)),
        })

    return alerts


def detect_over_concentration(holdings: List[Dict], balance: float) -> List[Dict]:
    """Detect single holding >30% of total portfolio."""
    alerts = []
    total_value = balance
    for h in holdings:
        qty = h.get('quantity', 0)
        price = h.get('currentPrice', h.get('averagePrice', 0))
        total_value += qty * price

    if total_value <= 0:
        return alerts

    for h in holdings:
        qty = h.get('quantity', 0)
        price = h.get('currentPrice', h.get('averagePrice', 0))
        holding_value = qty * price
        pct = (holding_value / total_value) * 100
        sym = h.get('symbol', '')

        if pct > 30:
            alerts.append({
                'pattern_type': 'over_concentration',
                'severity': 'warning',
                'symbol': sym,
                'message': PATTERNS['over_concentration']['message'].format(symbol=sym, pct=pct),
            })

    return alerts


def detect_holding_losers(holdings: List[Dict], transactions: List[Dict]) -> List[Dict]:
    """Detect >20% unrealized loss held >14 days."""
    alerts = []
    now = datetime.utcnow()

    for h in holdings:
        sym = h.get('symbol', '')
        avg_price = h.get('averagePrice', 0)
        current_price = h.get('currentPrice', avg_price)

        if avg_price <= 0:
            continue

        loss_pct = ((current_price - avg_price) / avg_price) * 100
        if loss_pct >= -20:
            continue

        # Find earliest buy for this holding
        buys = [
            t for t in transactions
            if t.get('symbol') == sym and t.get('action') == 'buy'
        ]
        if not buys:
            continue

        earliest_ts = min(
            (_parse_timestamp(t.get('timestamp', '')) for t in buys if _parse_timestamp(t.get('timestamp', ''))),
            default=None
        )
        if not earliest_ts:
            continue

        days_held = (now - earliest_ts).days
        if days_held >= 14:
            alerts.append({
                'pattern_type': 'holding_losers',
                'severity': 'info',
                'symbol': sym,
                'message': PATTERNS['holding_losers']['message'].format(
                    symbol=sym, loss_pct=abs(loss_pct), days=days_held
                ),
            })

    return alerts


def detect_high_risk_position(holdings: List[Dict], balance: float) -> List[Dict]:
    """Detect single position >25% of portfolio."""
    alerts = []
    total_value = balance
    for h in holdings:
        qty = h.get('quantity', 0)
        price = h.get('currentPrice', h.get('averagePrice', 0))
        total_value += qty * price

    if total_value <= 0:
        return alerts

    for h in holdings:
        qty = h.get('quantity', 0)
        price = h.get('currentPrice', h.get('averagePrice', 0))
        holding_value = qty * price
        pct = (holding_value / total_value) * 100
        sym = h.get('symbol', '')

        if pct > 25:
            alerts.append({
                'pattern_type': 'high_risk_position',
                'severity': 'warning',
                'symbol': sym,
                'message': PATTERNS['high_risk_position']['message'].format(symbol=sym, pct=pct),
            })

    return alerts


async def detect_sentiment_fomo(transactions: List[Dict]) -> List[Dict]:
    """Detect if user bought during extremely positive sentiment (>70% positive)."""
    alerts = []
    now = datetime.utcnow()

    # Only check recent buys (last 48h)
    recent_buys = [
        t for t in transactions
        if t.get('action') == 'buy'
        and _parse_timestamp(t.get('timestamp', ''))
        and _parse_timestamp(t.get('timestamp', '')) >= now - timedelta(hours=48)
    ]

    if not recent_buys:
        return alerts

    # Check sentiment for each recently bought symbol
    try:
        from database import get_cached_sentiment
        checked_symbols = set()
        for buy in recent_buys:
            sym = buy.get('symbol', '')
            if sym in checked_symbols:
                continue
            checked_symbols.add(sym)

            cached = await get_cached_sentiment(sym)
            if cached and cached.get('positive_pct', 0) > 70:
                alerts.append({
                    'pattern_type': 'sentiment_fomo',
                    'severity': 'warning',
                    'symbol': sym,
                    'message': PATTERNS['sentiment_fomo']['message'].format(
                        symbol=sym, positive_pct=cached['positive_pct']
                    ),
                    'sentiment_mood': cached.get('mood', 'positive'),
                })
                break  # One alert is enough
    except Exception as e:
        print(f"Sentiment FOMO check error: {e}")

    return alerts


async def run_all_checks(
    transactions: List[Dict],
    holdings: List[Dict],
    balance: float,
) -> List[Dict]:
    """Run all pattern detection checks and return combined alerts."""
    all_alerts = []
    all_alerts.extend(detect_fomo_buy(transactions, holdings))
    all_alerts.extend(detect_panic_sell(transactions))
    all_alerts.extend(detect_overtrading(transactions))
    all_alerts.extend(detect_over_concentration(holdings, balance))
    all_alerts.extend(detect_holding_losers(holdings, transactions))
    all_alerts.extend(detect_high_risk_position(holdings, balance))
    all_alerts.extend(await detect_sentiment_fomo(transactions))
    return all_alerts


def enrich_alerts_with_history(
    alerts: List[Dict],
    trigger_history: List[Dict],
) -> tuple:
    """Enrich alerts with escalation levels based on 30-day trigger history.
    Returns (enriched_alerts, improvement_notes)."""
    # Count prior occurrences of each pattern_type
    pattern_counts: Dict[str, int] = {}
    for t in trigger_history:
        pt = t.get('pattern_type', '')
        pattern_counts[pt] = pattern_counts.get(pt, 0) + 1

    enriched = []
    for alert in alerts:
        pt = alert.get('pattern_type', '')
        prior = pattern_counts.get(pt, 0)

        if prior == 0:
            level = 'first'
            note = 'First time this pattern has been detected.'
        elif prior <= 3:
            level = 'recurring'
            note = f'This pattern has occurred {prior} time(s) before in the last 30 days.'
        else:
            level = 'persistent'
            note = f'This is a persistent pattern ({prior} prior occurrences). Consider focused practice on this area.'

        enriched.append({
            **alert,
            'escalation_level': level,
            'prior_count': prior,
            'escalation_note': note,
        })

    # Identify improvements: patterns frequent (3+) in history but absent now
    current_patterns = {a.get('pattern_type', '') for a in alerts}
    improvement_notes = []
    for pt, count in pattern_counts.items():
        if count >= 3 and pt not in current_patterns:
            improvement_notes.append(
                f"Improvement: '{pt}' was triggered {count} times recently but was not detected now."
            )

    return enriched, improvement_notes


async def get_gemini_mentor_feedback(alerts: List[Dict], history_context: Optional[str] = None, sentiment_context: Optional[str] = None) -> Optional[str]:
    """Generate educational mentor feedback for detected patterns using Gemini."""
    if not GEMINI_AVAILABLE or not GEMINI_API_KEY or not alerts:
        return None

    try:
        pattern_descriptions = []
        for a in alerts:
            pattern_descriptions.append(f"- [{a['severity'].upper()}] {a['message']}")

        patterns_text = "\n".join(pattern_descriptions)

        history_block = ""
        if history_context:
            history_block = f"""

Historical context for this user:
{history_context}

Use this history to personalize your feedback. Acknowledge improvements and escalate recurring issues."""

        sentiment_block = ""
        if sentiment_context:
            sentiment_block = f"""

Current market sentiment context for traded assets:
{sentiment_context}

Use this sentiment data to provide context but do NOT predict future movement."""

        model = genai.GenerativeModel('gemini-2.0-flash-lite')
        prompt = f"""You are an educational trading mentor for a virtual paper-trading platform.
The following behavioral patterns were detected in the user's trading activity:

{patterns_text}{history_block}{sentiment_block}

Provide a brief (2-3 sentences) educational comment for each pattern.
Focus on teaching good trading habits and discipline.
Do NOT give buy/sell advice or predict prices.
Do NOT suggest specific trades.
Frame everything as educational and informational.
Return a JSON object with pattern_type as keys and feedback strings as values.
Return ONLY the JSON. No preamble, no markdown blocks."""

        response = await model.generate_content_async(prompt)
        text = response.text.strip()
        # Clean markdown if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3].strip()

        import json
        return json.loads(text)
    except Exception as e:
        print(f"Gemini mentor feedback error: {e}")
        return None


def _parse_timestamp(ts: str) -> Optional[datetime]:
    """Parse ISO timestamp string."""
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace('Z', '+00:00').replace('+00:00', ''))
    except (ValueError, TypeError):
        return None
