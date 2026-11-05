import sqlite3
from datetime import date
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "instance" / "verdict_ai.db"
INITIAL_CASH = 100000.0


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db():
    with get_connection() as connection:
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                google_sub TEXT UNIQUE,
                email TEXT UNIQUE,
                name TEXT NOT NULL,
                cash_balance REAL NOT NULL DEFAULT 100000,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                action TEXT NOT NULL CHECK(action IN ('BUY', 'SELL')),
                quantity REAL NOT NULL CHECK(quantity > 0),
                price REAL NOT NULL CHECK(price > 0),
                reason TEXT NOT NULL DEFAULT '',
                trade_date TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_trades_user_date
            ON trades(user_id, trade_date, id);
        """)


def _user_dict(row):
    return dict(row) if row else None


def create_guest_user(name):
    clean_name = (name or "Demo Investor").strip()[:80] or "Demo Investor"
    with get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO users (name) VALUES (?)", (clean_name,)
        )
        row = connection.execute(
            "SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return _user_dict(row)


def get_user(user_id):
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        return _user_dict(row)


def create_or_get_google_user(google_sub, email, name):
    """Call only after the Google ID token has been verified by the backend."""
    with get_connection() as connection:
        existing = connection.execute(
            "SELECT * FROM users WHERE google_sub = ?", (google_sub,)
        ).fetchone()
        if existing:
            connection.execute(
                "UPDATE users SET email = ?, name = ? WHERE id = ?",
                (email, name, existing["id"]),
            )
            row = connection.execute(
                "SELECT * FROM users WHERE id = ?", (existing["id"],)
            ).fetchone()
            return _user_dict(row)

        cursor = connection.execute(
            "INSERT INTO users (google_sub, email, name) VALUES (?, ?, ?)",
            (google_sub, email, name or email or "Verdict AI User"),
        )
        row = connection.execute(
            "SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return _user_dict(row)


def get_user_trades(user_id):
    with get_connection() as connection:
        rows = connection.execute(
            """SELECT id, symbol, action, quantity, price, reason, trade_date
               FROM trades WHERE user_id = ?
               ORDER BY trade_date ASC, id ASC""",
            (user_id,),
        ).fetchall()
        return [
            {
                "id": f"U{row['id']}",
                "symbol": row["symbol"],
                "action": row["action"],
                "quantity": row["quantity"],
                "price": row["price"],
                "date": row["trade_date"],
                "reason": row["reason"],
            }
            for row in rows
        ]


def _positions_from_trades(trades):
    positions = {}
    for trade in trades:
        symbol = trade["symbol"]
        position = positions.setdefault(symbol, {"quantity": 0.0, "cost": 0.0})
        quantity = float(trade["quantity"])
        price = float(trade["price"])
        if trade["action"] == "BUY":
            position["quantity"] += quantity
            position["cost"] += quantity * price
        else:
            average_cost = (
                position["cost"] / position["quantity"]
                if position["quantity"] else 0.0
            )
            position["quantity"] -= quantity
            position["cost"] -= average_cost * quantity
            if position["quantity"] <= 1e-9:
                position["quantity"] = 0.0
                position["cost"] = 0.0
    return positions


def add_trade(user_id, symbol, action, quantity, price, reason="",
              trade_date=None):
    symbol = (symbol or "").strip().upper()
    action = (action or "").strip().upper()
    quantity = float(quantity)
    price = float(price)
    reason = (reason or "").strip()[:300]
    trade_date = trade_date or date.today().isoformat()

    if not symbol or len(symbol) > 20:
        raise ValueError("Enter a valid stock symbol.")
    if action not in ("BUY", "SELL"):
        raise ValueError("Action must be BUY or SELL.")
    if quantity <= 0 or price <= 0:
        raise ValueError("Quantity and price must be greater than zero.")

    with get_connection() as connection:
        user = connection.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        if not user:
            raise LookupError("User not found.")

        existing_rows = connection.execute(
            "SELECT symbol, action, quantity, price FROM trades WHERE user_id = ?",
            (user_id,),
        ).fetchall()
        trades = [dict(row) for row in existing_rows]
        positions = _positions_from_trades(trades)
        held = positions.get(symbol, {}).get("quantity", 0.0)
        cost = quantity * price

        if action == "BUY" and cost > float(user["cash_balance"]) + 1e-9:
            raise ValueError("Insufficient simulated cash balance.")
        if action == "SELL" and quantity > held + 1e-9:
            raise ValueError("You cannot sell more shares than you currently hold.")

        cursor = connection.execute(
            """INSERT INTO trades
               (user_id, symbol, action, quantity, price, reason, trade_date)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (user_id, symbol, action, quantity, price, reason, trade_date),
        )
        cash_change = -cost if action == "BUY" else cost
        connection.execute(
            "UPDATE users SET cash_balance = cash_balance + ? WHERE id = ?",
            (cash_change, user_id),
        )
        return {
            "id": f"U{cursor.lastrowid}",
            "symbol": symbol,
            "action": action,
            "quantity": quantity,
            "price": price,
            "reason": reason,
            "date": trade_date,
        }


def get_portfolio(user_id):
    user = get_user(user_id)
    if not user:
        return None
    trades = get_user_trades(user_id)
    positions = _positions_from_trades(trades)
    holdings = []
    for symbol, position in sorted(positions.items()):
        if position["quantity"] > 1e-9:
            holdings.append({
                "symbol": symbol,
                "quantity": round(position["quantity"], 6),
                "average_cost": round(
                    position["cost"] / position["quantity"], 4
                ),
                "invested_value": round(position["cost"], 2),
            })
    return {
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        },
        "cash_balance": round(float(user["cash_balance"]), 2),
        "holdings": holdings,
        "trade_count": len(trades),
        "data_mode": "simulated",
    }
