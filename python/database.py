"""
SQLite database module for StockMind persistent data storage.
Uses aiosqlite for async access within FastAPI.
Stores portfolio, holdings, transactions, alerts, watchlist,
checklists, mentor triggers, scores, badges, reports, and challenges.
"""

import aiosqlite
import os
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

# Database file path (same directory as this module)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stockmind.db")

# Default portfolio values
DEFAULT_BALANCE = 100000.0
DEFAULT_CURRENCY = "USD"


async def init_db():
    """Initialize the database and create tables if they don't exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS portfolio (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                balance REAL NOT NULL DEFAULT 100000.0,
                starting_balance REAL NOT NULL DEFAULT 100000.0,
                base_currency TEXT NOT NULL DEFAULT 'USD',
                created_at TEXT NOT NULL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS holdings (
                symbol TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('stock', 'crypto')),
                name TEXT NOT NULL,
                quantity REAL NOT NULL,
                average_price REAL NOT NULL,
                PRIMARY KEY (symbol, type)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                symbol TEXT NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('stock', 'crypto')),
                action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
                quantity REAL NOT NULL,
                price REAL NOT NULL,
                total REAL NOT NULL,
                timestamp TEXT NOT NULL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                symbol TEXT NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('stock', 'crypto')),
                target_price REAL NOT NULL,
                condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
                active INTEGER NOT NULL DEFAULT 1,
                triggered INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                symbol TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                added_at TEXT NOT NULL
            )
        """)

        # ====== MENTOR & EVALUATION TABLES ======

        await db.execute("""
            CREATE TABLE IF NOT EXISTS trade_checklists (
                id TEXT PRIMARY KEY,
                transaction_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                type TEXT NOT NULL,
                action TEXT NOT NULL,
                item_company_understood INTEGER NOT NULL DEFAULT 0,
                item_chart_reviewed INTEGER NOT NULL DEFAULT 0,
                item_position_size INTEGER NOT NULL DEFAULT 0,
                item_exit_plan INTEGER NOT NULL DEFAULT 0,
                item_risk_acceptable INTEGER NOT NULL DEFAULT 0,
                skipped INTEGER NOT NULL DEFAULT 0,
                completed_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS mentor_triggers (
                id TEXT PRIMARY KEY,
                pattern_type TEXT NOT NULL,
                severity TEXT NOT NULL DEFAULT 'info',
                symbol TEXT,
                message TEXT NOT NULL,
                gemini_feedback TEXT,
                dismissed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS daily_scores (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL UNIQUE,
                risk_score REAL NOT NULL DEFAULT 0,
                discipline_score REAL NOT NULL DEFAULT 0,
                strategy_score REAL NOT NULL DEFAULT 0,
                psychology_score REAL NOT NULL DEFAULT 0,
                consistency_score REAL NOT NULL DEFAULT 0,
                trade_count INTEGER NOT NULL DEFAULT 0,
                active_day INTEGER NOT NULL DEFAULT 1,
                computed_at TEXT NOT NULL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS badges (
                id TEXT PRIMARY KEY,
                badge_type TEXT NOT NULL UNIQUE,
                earned INTEGER NOT NULL DEFAULT 0,
                active INTEGER NOT NULL DEFAULT 0,
                qualifying_days INTEGER NOT NULL DEFAULT 0,
                first_earned_at TEXT,
                last_active_at TEXT,
                updated_at TEXT NOT NULL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS monthly_reports (
                id TEXT PRIMARY KEY,
                period_start TEXT NOT NULL,
                period_end TEXT NOT NULL,
                risk_avg REAL,
                discipline_avg REAL,
                strategy_avg REAL,
                psychology_avg REAL,
                consistency_avg REAL,
                overall_grade TEXT,
                best_trade_id TEXT,
                worst_trade_id TEXT,
                patterns_detected TEXT,
                gemini_summary TEXT,
                badge_updates TEXT,
                created_at TEXT NOT NULL
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS challenges (
                id TEXT PRIMARY KEY,
                challenge_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                target_value REAL NOT NULL,
                current_value REAL NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'active',
                started_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                completed_at TEXT,
                badge_reward TEXT
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS trade_journal (
                id TEXT PRIMARY KEY,
                transaction_id TEXT,
                symbol TEXT NOT NULL,
                mood TEXT NOT NULL CHECK (mood IN ('confident', 'anxious', 'neutral', 'frustrated', 'excited')),
                note TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        # ====== SENTIMENT TABLES ======

        await db.execute("""
            CREATE TABLE IF NOT EXISTS sentiment_cache (
                symbol TEXT PRIMARY KEY,
                positive_pct REAL,
                neutral_pct REAL,
                negative_pct REAL,
                mixed_pct REAL,
                mood TEXT,
                summary TEXT,
                article_count INTEGER,
                classified_articles TEXT,
                fetched_at TEXT,
                expires_at TEXT
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS divergence_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                signal TEXT NOT NULL,
                price_change_pct REAL,
                sentiment_mood TEXT,
                snapshot_date TEXT NOT NULL,
                UNIQUE(symbol, snapshot_date)
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS sentiment_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT,
                mood TEXT,
                positive_pct REAL,
                neutral_pct REAL,
                negative_pct REAL,
                mixed_pct REAL,
                summary TEXT,
                snapshot_date TEXT,
                UNIQUE(symbol, snapshot_date)
            )
        """)

        await db.commit()

        # Ensure a default portfolio row exists
        cursor = await db.execute("SELECT id FROM portfolio WHERE id = 1")
        row = await cursor.fetchone()
        if not row:
            await db.execute(
                "INSERT INTO portfolio (id, balance, starting_balance, base_currency, created_at) VALUES (1, ?, ?, ?, ?)",
                (DEFAULT_BALANCE, DEFAULT_BALANCE, DEFAULT_CURRENCY, datetime.utcnow().isoformat())
            )
            await db.commit()

    print(f"Database initialized at {DB_PATH}")


# ============================================================================
# PORTFOLIO
# ============================================================================

async def get_portfolio() -> Dict[str, Any]:
    """Get portfolio with balance info."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM portfolio WHERE id = 1")
        row = await cursor.fetchone()
        if row:
            return {
                "balance": row["balance"],
                "startingBalance": row["starting_balance"],
                "baseCurrency": row["base_currency"],
                "createdAt": row["created_at"],
            }
        return {
            "balance": DEFAULT_BALANCE,
            "startingBalance": DEFAULT_BALANCE,
            "baseCurrency": DEFAULT_CURRENCY,
            "createdAt": datetime.utcnow().isoformat(),
        }


async def save_portfolio(balance: float):
    """Update portfolio balance."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE portfolio SET balance = ? WHERE id = 1", (balance,))
        await db.commit()


async def reset_portfolio():
    """Reset portfolio to defaults: clear holdings, transactions, reset balance."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE portfolio SET balance = ?, starting_balance = ?, created_at = ? WHERE id = 1",
            (DEFAULT_BALANCE, DEFAULT_BALANCE, datetime.utcnow().isoformat())
        )
        await db.execute("DELETE FROM holdings")
        await db.execute("DELETE FROM transactions")
        await db.commit()


# ============================================================================
# HOLDINGS
# ============================================================================

async def get_holdings() -> List[Dict[str, Any]]:
    """Get all holdings."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM holdings")
        rows = await cursor.fetchall()
        return [
            {
                "symbol": row["symbol"],
                "type": row["type"],
                "name": row["name"],
                "quantity": row["quantity"],
                "averagePrice": row["average_price"],
            }
            for row in rows
        ]


async def upsert_holding(symbol: str, type: str, name: str, quantity: float, average_price: float):
    """Insert or update a holding."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO holdings (symbol, type, name, quantity, average_price)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(symbol, type) DO UPDATE SET
                 name = excluded.name,
                 quantity = excluded.quantity,
                 average_price = excluded.average_price""",
            (symbol, type, name, quantity, average_price)
        )
        await db.commit()


async def delete_holding(symbol: str, type: str):
    """Delete a holding."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM holdings WHERE symbol = ? AND type = ?", (symbol, type))
        await db.commit()


async def update_holding_quantity(symbol: str, type: str, quantity: float, average_price: float):
    """Update holding quantity and average price."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE holdings SET quantity = ?, average_price = ? WHERE symbol = ? AND type = ?",
            (quantity, average_price, symbol, type)
        )
        await db.commit()


# ============================================================================
# TRANSACTIONS
# ============================================================================

async def get_transactions() -> List[Dict[str, Any]]:
    """Get all transactions, newest first."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM transactions ORDER BY timestamp DESC")
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "symbol": row["symbol"],
                "name": row["name"],
                "type": row["type"],
                "action": row["action"],
                "quantity": row["quantity"],
                "price": row["price"],
                "total": row["total"],
                "timestamp": row["timestamp"],
            }
            for row in rows
        ]


async def add_transaction(tx_id: str, symbol: str, name: str, type: str, action: str,
                          quantity: float, price: float, total: float, timestamp: str):
    """Add a new transaction."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO transactions (id, symbol, name, type, action, quantity, price, total, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (tx_id, symbol, name, type, action, quantity, price, total, timestamp)
        )
        await db.commit()


# ============================================================================
# ALERTS
# ============================================================================

async def get_alerts() -> List[Dict[str, Any]]:
    """Get all alerts."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM alerts ORDER BY created_at DESC")
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "symbol": row["symbol"],
                "name": row["name"],
                "type": row["type"],
                "targetPrice": row["target_price"],
                "condition": row["condition"],
                "active": bool(row["active"]),
                "triggered": bool(row["triggered"]),
                "createdAt": row["created_at"],
            }
            for row in rows
        ]


async def add_alert(alert_id: str, symbol: str, name: str, type: str,
                    target_price: float, condition: str, created_at: str):
    """Add a new alert."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO alerts (id, symbol, name, type, target_price, condition, active, triggered, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?)",
            (alert_id, symbol, name, type, target_price, condition, created_at)
        )
        await db.commit()


async def update_alert(alert_id: str, updates: Dict[str, Any]):
    """Update an alert's fields."""
    allowed_fields = {"active": "active", "triggered": "triggered", "target_price": "target_price", "condition": "condition"}
    # Map camelCase keys to snake_case DB columns
    camel_map = {"targetPrice": "target_price"}

    set_parts = []
    values = []
    for key, val in updates.items():
        col = camel_map.get(key, key)
        if col in allowed_fields:
            db_col = allowed_fields[col]
            set_parts.append(f"{db_col} = ?")
            values.append(int(val) if isinstance(val, bool) else val)

    if not set_parts:
        return

    values.append(alert_id)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(f"UPDATE alerts SET {', '.join(set_parts)} WHERE id = ?", values)
        await db.commit()


async def delete_alert(alert_id: str):
    """Delete an alert."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
        await db.commit()


# ============================================================================
# WATCHLIST
# ============================================================================

async def get_watchlist() -> List[Dict[str, Any]]:
    """Get all watchlist items."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM watchlist ORDER BY added_at DESC")
        rows = await cursor.fetchall()
        return [
            {
                "symbol": row["symbol"],
                "name": row["name"],
                "type": row["type"],
                "addedAt": row["added_at"],
            }
            for row in rows
        ]


async def add_watchlist_item(symbol: str, name: str, type: str, added_at: str):
    """Add item to watchlist (ignore if already exists)."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR IGNORE INTO watchlist (symbol, name, type, added_at) VALUES (?, ?, ?, ?)",
            (symbol, name, type, added_at)
        )
        await db.commit()


async def remove_watchlist_item(symbol: str):
    """Remove item from watchlist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM watchlist WHERE symbol = ?", (symbol,))
        await db.commit()


# ============================================================================
# TRADE CHECKLISTS
# ============================================================================

async def add_checklist(
    checklist_id: str, transaction_id: str, symbol: str, type: str, action: str,
    company_understood: bool, chart_reviewed: bool, position_size: bool,
    exit_plan: bool, risk_acceptable: bool, skipped: bool, completed_count: int,
    created_at: str,
):
    """Save a trade checklist entry."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO trade_checklists
               (id, transaction_id, symbol, type, action,
                item_company_understood, item_chart_reviewed, item_position_size,
                item_exit_plan, item_risk_acceptable, skipped, completed_count, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (checklist_id, transaction_id, symbol, type, action,
             int(company_understood), int(chart_reviewed), int(position_size),
             int(exit_plan), int(risk_acceptable), int(skipped), completed_count, created_at)
        )
        await db.commit()


async def get_checklists(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """Get checklist history."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM trade_checklists ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "transactionId": row["transaction_id"],
                "symbol": row["symbol"],
                "type": row["type"],
                "action": row["action"],
                "items": {
                    "company_understood": bool(row["item_company_understood"]),
                    "chart_reviewed": bool(row["item_chart_reviewed"]),
                    "position_size": bool(row["item_position_size"]),
                    "exit_plan": bool(row["item_exit_plan"]),
                    "risk_acceptable": bool(row["item_risk_acceptable"]),
                },
                "skipped": bool(row["skipped"]),
                "completedCount": row["completed_count"],
                "createdAt": row["created_at"],
            }
            for row in rows
        ]


async def get_checklist_stats(days: int = 30) -> Dict[str, Any]:
    """Get aggregated checklist stats for the given period."""
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        cursor = await db.execute(
            "SELECT COUNT(*) as total FROM trade_checklists WHERE created_at >= ?",
            (cutoff,)
        )
        total_row = await cursor.fetchone()
        total = total_row["total"] if total_row else 0

        cursor = await db.execute(
            "SELECT COUNT(*) as full_count FROM trade_checklists WHERE created_at >= ? AND completed_count = 5 AND skipped = 0",
            (cutoff,)
        )
        full_row = await cursor.fetchone()
        full_count = full_row["full_count"] if full_row else 0

        cursor = await db.execute(
            "SELECT COUNT(*) as skip_count FROM trade_checklists WHERE created_at >= ? AND skipped = 1",
            (cutoff,)
        )
        skip_row = await cursor.fetchone()
        skip_count = skip_row["skip_count"] if skip_row else 0

        cursor = await db.execute(
            "SELECT AVG(completed_count) as avg_items FROM trade_checklists WHERE created_at >= ?",
            (cutoff,)
        )
        avg_row = await cursor.fetchone()
        avg_items = avg_row["avg_items"] if avg_row and avg_row["avg_items"] else 0

        return {
            "totalChecklists": total,
            "completionRate": round((full_count / total * 100) if total > 0 else 0, 1),
            "skipRate": round((skip_count / total * 100) if total > 0 else 0, 1),
            "averageItemsChecked": round(avg_items, 1),
        }


async def get_checklists_raw(days: int = 30) -> List[Dict[str, Any]]:
    """Get raw checklist data for scoring engine."""
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM trade_checklists WHERE created_at >= ? ORDER BY created_at DESC",
            (cutoff,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


# ============================================================================
# MENTOR TRIGGERS
# ============================================================================

async def add_mentor_trigger(
    trigger_id: str, pattern_type: str, severity: str,
    symbol: Optional[str], message: str, gemini_feedback: Optional[str],
    created_at: str,
):
    """Save a mentor trigger."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO mentor_triggers
               (id, pattern_type, severity, symbol, message, gemini_feedback, dismissed, created_at)
               VALUES (?, ?, ?, ?, ?, ?, 0, ?)""",
            (trigger_id, pattern_type, severity, symbol, message, gemini_feedback, created_at)
        )
        await db.commit()


async def dismiss_mentor_trigger(trigger_id: str):
    """Mark a mentor trigger as dismissed."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE mentor_triggers SET dismissed = 1 WHERE id = ?",
            (trigger_id,)
        )
        await db.commit()


async def get_mentor_triggers(limit: int = 50) -> List[Dict[str, Any]]:
    """Get mentor trigger history."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM mentor_triggers ORDER BY created_at DESC LIMIT ?",
            (limit,)
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "patternType": row["pattern_type"],
                "severity": row["severity"],
                "symbol": row["symbol"],
                "message": row["message"],
                "geminiFeedback": row["gemini_feedback"],
                "dismissed": bool(row["dismissed"]),
                "createdAt": row["created_at"],
            }
            for row in rows
        ]


async def get_mentor_triggers_raw(days: int = 30) -> List[Dict[str, Any]]:
    """Get raw mentor triggers for scoring engine."""
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM mentor_triggers WHERE created_at >= ?",
            (cutoff,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


# ============================================================================
# DAILY SCORES
# ============================================================================

async def upsert_daily_score(
    score_id: str, date: str,
    risk: float, discipline: float, strategy: float,
    psychology: float, consistency: float,
    trade_count: int, active_day: bool,
):
    """Insert or update daily scores (idempotent per date)."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO daily_scores
               (id, date, risk_score, discipline_score, strategy_score,
                psychology_score, consistency_score, trade_count, active_day, computed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(date) DO UPDATE SET
                 risk_score = excluded.risk_score,
                 discipline_score = excluded.discipline_score,
                 strategy_score = excluded.strategy_score,
                 psychology_score = excluded.psychology_score,
                 consistency_score = excluded.consistency_score,
                 trade_count = excluded.trade_count,
                 active_day = excluded.active_day,
                 computed_at = excluded.computed_at""",
            (score_id, date, risk, discipline, strategy, psychology, consistency,
             trade_count, int(active_day), datetime.utcnow().isoformat())
        )
        await db.commit()


async def get_daily_scores(days: int = 30) -> List[Dict[str, Any]]:
    """Get daily scores for last N days."""
    cutoff = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM daily_scores WHERE date >= ? ORDER BY date DESC",
            (cutoff,)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_latest_daily_score() -> Optional[Dict[str, Any]]:
    """Get the most recent daily score."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM daily_scores ORDER BY date DESC LIMIT 1"
        )
        row = await cursor.fetchone()
        if row:
            return {
                "date": row["date"],
                "risk": row["risk_score"],
                "discipline": row["discipline_score"],
                "strategy": row["strategy_score"],
                "psychology": row["psychology_score"],
                "consistency": row["consistency_score"],
                "tradeCount": row["trade_count"],
                "activeDay": bool(row["active_day"]),
            }
        return None


# ============================================================================
# BADGES
# ============================================================================

async def upsert_badge(
    badge_id: str, badge_type: str, earned: bool, active: bool,
    qualifying_days: int, first_earned_at: Optional[str], updated_at: str,
):
    """Insert or update badge status."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO badges
               (id, badge_type, earned, active, qualifying_days, first_earned_at, last_active_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(badge_type) DO UPDATE SET
                 earned = excluded.earned,
                 active = excluded.active,
                 qualifying_days = excluded.qualifying_days,
                 first_earned_at = COALESCE(badges.first_earned_at, excluded.first_earned_at),
                 last_active_at = CASE WHEN excluded.active = 1 THEN excluded.updated_at ELSE badges.last_active_at END,
                 updated_at = excluded.updated_at""",
            (badge_id, badge_type, int(earned), int(active), qualifying_days,
             first_earned_at, updated_at if active else None, updated_at)
        )
        await db.commit()


async def get_badges() -> List[Dict[str, Any]]:
    """Get all badge statuses."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM badges ORDER BY badge_type")
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "badgeType": row["badge_type"],
                "earned": bool(row["earned"]),
                "active": bool(row["active"]),
                "qualifyingDays": row["qualifying_days"],
                "firstEarnedAt": row["first_earned_at"],
                "updatedAt": row["updated_at"],
            }
            for row in rows
        ]


# ============================================================================
# MONTHLY REPORTS
# ============================================================================

async def add_monthly_report(
    report_id: str, period_start: str, period_end: str,
    risk_avg: float, discipline_avg: float, strategy_avg: float,
    psychology_avg: float, consistency_avg: float,
    overall_grade: str, best_trade_id: Optional[str], worst_trade_id: Optional[str],
    patterns_detected: str, gemini_summary: str, badge_updates: str,
    created_at: str,
):
    """Save a monthly report."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO monthly_reports
               (id, period_start, period_end, risk_avg, discipline_avg, strategy_avg,
                psychology_avg, consistency_avg, overall_grade, best_trade_id, worst_trade_id,
                patterns_detected, gemini_summary, badge_updates, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (report_id, period_start, period_end, risk_avg, discipline_avg, strategy_avg,
             psychology_avg, consistency_avg, overall_grade, best_trade_id, worst_trade_id,
             patterns_detected, gemini_summary, badge_updates, created_at)
        )
        await db.commit()


async def get_latest_report() -> Optional[Dict[str, Any]]:
    """Get the most recent monthly report."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM monthly_reports ORDER BY created_at DESC LIMIT 1"
        )
        row = await cursor.fetchone()
        if not row:
            return None
        return _format_report(row)


async def get_report_history(limit: int = 12) -> List[Dict[str, Any]]:
    """Get report history."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM monthly_reports ORDER BY created_at DESC LIMIT ?",
            (limit,)
        )
        rows = await cursor.fetchall()
        return [_format_report(row) for row in rows]


def _format_report(row) -> Dict[str, Any]:
    """Format a monthly report row."""
    return {
        "id": row["id"],
        "periodStart": row["period_start"],
        "periodEnd": row["period_end"],
        "scores": {
            "risk": row["risk_avg"] or 0,
            "discipline": row["discipline_avg"] or 0,
            "strategy": row["strategy_avg"] or 0,
            "psychology": row["psychology_avg"] or 0,
            "consistency": row["consistency_avg"] or 0,
        },
        "overallGrade": row["overall_grade"],
        "bestTradeId": row["best_trade_id"],
        "worstTradeId": row["worst_trade_id"],
        "patternsDetected": json.loads(row["patterns_detected"]) if row["patterns_detected"] else [],
        "geminiSummary": row["gemini_summary"] or "",
        "badgeUpdates": json.loads(row["badge_updates"]) if row["badge_updates"] else [],
        "createdAt": row["created_at"],
    }


# ============================================================================
# CHALLENGES
# ============================================================================

async def add_challenge(
    challenge_id: str, challenge_type: str, title: str, description: str,
    target_value: float, started_at: str, expires_at: str,
):
    """Create a new challenge."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO challenges
               (id, challenge_type, title, description, target_value, current_value, status, started_at, expires_at)
               VALUES (?, ?, ?, ?, ?, 0, 'active', ?, ?)""",
            (challenge_id, challenge_type, title, description, target_value, started_at, expires_at)
        )
        await db.commit()


async def update_challenge(challenge_id: str, current_value: float, status: str, completed_at: Optional[str] = None):
    """Update challenge progress."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE challenges SET current_value = ?, status = ?, completed_at = ? WHERE id = ?",
            (current_value, status, completed_at, challenge_id)
        )
        await db.commit()


async def get_active_challenges() -> List[Dict[str, Any]]:
    """Get active challenges."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM challenges WHERE status = 'active' ORDER BY started_at DESC"
        )
        rows = await cursor.fetchall()
        return [_format_challenge(row) for row in rows]


async def get_challenge_history(limit: int = 20) -> List[Dict[str, Any]]:
    """Get past challenges."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM challenges WHERE status != 'active' ORDER BY completed_at DESC LIMIT ?",
            (limit,)
        )
        rows = await cursor.fetchall()
        return [_format_challenge(row) for row in rows]


async def get_completed_challenge_count() -> int:
    """Get count of completed challenges."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT COUNT(*) as cnt FROM challenges WHERE status = 'completed'"
        )
        row = await cursor.fetchone()
        return row[0] if row else 0


def _format_challenge(row) -> Dict[str, Any]:
    """Format a challenge row."""
    target = row["target_value"]
    current = row["current_value"]
    progress = min((current / target * 100) if target > 0 else 0, 100)
    return {
        "id": row["id"],
        "challengeType": row["challenge_type"],
        "title": row["title"],
        "description": row["description"],
        "targetValue": target,
        "currentValue": current,
        "progress": round(progress, 1),
        "status": row["status"],
        "startedAt": row["started_at"],
        "expiresAt": row["expires_at"],
        "completedAt": row["completed_at"],
    }


# ============================================================================
# TRADE JOURNAL
# ============================================================================

async def add_journal_entry(
    entry_id: str, transaction_id: Optional[str], symbol: str,
    mood: str, note: str, created_at: str,
):
    """Save a trade journal entry."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO trade_journal
               (id, transaction_id, symbol, mood, note, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (entry_id, transaction_id, symbol, mood, note, created_at)
        )
        await db.commit()


async def get_journal_entries(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """Get journal entries, newest first."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM trade_journal ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )
        rows = await cursor.fetchall()
        return [_format_journal_entry(row) for row in rows]


async def get_journal_entries_for_symbol(symbol: str) -> List[Dict[str, Any]]:
    """Get journal entries for a specific symbol."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM trade_journal WHERE symbol = ? ORDER BY created_at DESC",
            (symbol,)
        )
        rows = await cursor.fetchall()
        return [_format_journal_entry(row) for row in rows]


async def get_journal_entries_for_transaction(transaction_id: str) -> List[Dict[str, Any]]:
    """Get journal entries for a specific transaction."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM trade_journal WHERE transaction_id = ? ORDER BY created_at DESC",
            (transaction_id,)
        )
        rows = await cursor.fetchall()
        return [_format_journal_entry(row) for row in rows]


def _format_journal_entry(row) -> Dict[str, Any]:
    """Format a journal entry row."""
    return {
        "id": row["id"],
        "transactionId": row["transaction_id"],
        "symbol": row["symbol"],
        "mood": row["mood"],
        "note": row["note"],
        "createdAt": row["created_at"],
    }


# ============================================================================
# ALL DAILY SCORES (no date filter)
# ============================================================================

async def get_all_daily_scores() -> List[Dict[str, Any]]:
    """Get all daily scores ordered by date (for behavior tracking)."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM daily_scores ORDER BY date ASC"
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]


async def get_trigger_counts_by_type() -> Dict[str, int]:
    """Get all-time trigger counts grouped by pattern_type."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "SELECT pattern_type, COUNT(*) as cnt FROM mentor_triggers GROUP BY pattern_type"
        )
        rows = await cursor.fetchall()
        return {row[0]: row[1] for row in rows}


# ============================================================================
# SENTIMENT CACHE & HISTORY
# ============================================================================

async def get_cached_sentiment(symbol: str) -> Optional[Dict[str, Any]]:
    """Get cached sentiment if not expired."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM sentiment_cache WHERE symbol = ?", (symbol.upper(),)
        )
        row = await cursor.fetchone()
        if not row:
            return None

        # Check expiry
        expires_at = row["expires_at"]
        if expires_at and datetime.utcnow().isoformat() > expires_at:
            return None

        return {
            "positive_pct": row["positive_pct"] or 0.0,
            "neutral_pct": row["neutral_pct"] or 0.0,
            "negative_pct": row["negative_pct"] or 0.0,
            "mixed_pct": row["mixed_pct"] or 0.0,
            "mood": row["mood"] or "neutral",
            "summary": row["summary"] or "",
            "article_count": row["article_count"] or 0,
            "classified_articles": json.loads(row["classified_articles"]) if row["classified_articles"] else [],
            "fetched_at": row["fetched_at"],
        }


async def save_sentiment_cache(symbol: str, data: Dict[str, Any], short_ttl: bool = False):
    """Save sentiment result to cache. Uses 2h TTL for neutral/empty results, 24h for real data."""
    now = datetime.utcnow()
    ttl_hours = 2 if short_ttl else 24
    expires = (now + timedelta(hours=ttl_hours)).isoformat()
    articles_json = json.dumps(data.get("classified_articles", []))

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO sentiment_cache
               (symbol, positive_pct, neutral_pct, negative_pct, mixed_pct,
                mood, summary, article_count, classified_articles, fetched_at, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(symbol) DO UPDATE SET
                 positive_pct = excluded.positive_pct,
                 neutral_pct = excluded.neutral_pct,
                 negative_pct = excluded.negative_pct,
                 mixed_pct = excluded.mixed_pct,
                 mood = excluded.mood,
                 summary = excluded.summary,
                 article_count = excluded.article_count,
                 classified_articles = excluded.classified_articles,
                 fetched_at = excluded.fetched_at,
                 expires_at = excluded.expires_at""",
            (symbol.upper(), data.get("positive_pct", 0), data.get("neutral_pct", 100),
             data.get("negative_pct", 0), data.get("mixed_pct", 0),
             data.get("mood", "neutral"), data.get("summary", ""),
             data.get("article_count", 0), articles_json,
             now.isoformat(), expires)
        )
        await db.commit()


async def clear_sentiment_cache():
    """Clear all cached sentiment data so fresh fetches happen on next request."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM sentiment_cache")
        await db.commit()
    print("[Database] Sentiment cache cleared")


async def save_sentiment_snapshot(symbol: str, data: Dict[str, Any]):
    """Save a daily sentiment snapshot for historical tracking."""
    today = datetime.utcnow().date().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO sentiment_history
               (symbol, mood, positive_pct, neutral_pct, negative_pct, mixed_pct, summary, snapshot_date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(symbol, snapshot_date) DO UPDATE SET
                 mood = excluded.mood,
                 positive_pct = excluded.positive_pct,
                 neutral_pct = excluded.neutral_pct,
                 negative_pct = excluded.negative_pct,
                 mixed_pct = excluded.mixed_pct,
                 summary = excluded.summary""",
            (symbol.upper(), data.get("mood", "neutral"),
             data.get("positive_pct", 0), data.get("neutral_pct", 100),
             data.get("negative_pct", 0), data.get("mixed_pct", 0),
             data.get("summary", ""), today)
        )
        await db.commit()


async def save_divergence_snapshot(symbol: str, signal: str, price_change_pct: float, sentiment_mood: str):
    """Save a daily divergence snapshot."""
    today = datetime.utcnow().date().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO divergence_snapshots
               (symbol, signal, price_change_pct, sentiment_mood, snapshot_date)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(symbol, snapshot_date) DO UPDATE SET
                 signal = excluded.signal,
                 price_change_pct = excluded.price_change_pct,
                 sentiment_mood = excluded.sentiment_mood""",
            (symbol.upper(), signal, price_change_pct, sentiment_mood, today)
        )
        await db.commit()


async def get_divergence_history(symbol: str, days: int = 30) -> List[Dict[str, Any]]:
    """Get divergence history for a symbol."""
    cutoff = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM divergence_snapshots WHERE symbol = ? AND snapshot_date >= ? ORDER BY snapshot_date DESC",
            (symbol.upper(), cutoff)
        )
        rows = await cursor.fetchall()
        return [
            {
                "symbol": row["symbol"],
                "signal": row["signal"],
                "priceChangePct": row["price_change_pct"],
                "sentimentMood": row["sentiment_mood"],
                "snapshotDate": row["snapshot_date"],
            }
            for row in rows
        ]


async def get_sentiment_history(symbol: str, days: int = 30) -> List[Dict[str, Any]]:
    """Get sentiment history snapshots for a symbol."""
    cutoff = (datetime.utcnow() - timedelta(days=days)).date().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM sentiment_history WHERE symbol = ? AND snapshot_date >= ? ORDER BY snapshot_date DESC",
            (symbol.upper(), cutoff)
        )
        rows = await cursor.fetchall()
        return [
            {
                "symbol": row["symbol"],
                "mood": row["mood"],
                "positive_pct": row["positive_pct"],
                "neutral_pct": row["neutral_pct"],
                "negative_pct": row["negative_pct"],
                "mixed_pct": row["mixed_pct"],
                "summary": row["summary"],
                "snapshotDate": row["snapshot_date"],
            }
            for row in rows
        ]
