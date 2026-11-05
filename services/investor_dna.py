from collections import defaultdict, deque
from datetime import date


def _parse_date(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def _percent(part, whole):
    return round((part / whole) * 100, 1) if whole else 0.0


def analyse_investor_dna(investor):
    """Calculate observable trading habits from fictional trade records.

    This describes patterns in the supplied sample only. It does not predict
    returns, diagnose personality, or recommend any investment action.
    """
    trades = sorted(
        investor.get("trades", []),
        key=lambda item: (item.get("date", ""), item.get("id", ""))
    )
    buys = [t for t in trades if str(t.get("action", "")).upper() == "BUY"]
    sells = [t for t in trades if str(t.get("action", "")).upper() == "SELL"]
    active_days = len({t.get("date") for t in trades if t.get("date")})

    # FIFO matching gives an approximate holding period and realised P/L.
    open_lots = defaultdict(deque)
    closed_trades = []
    for trade in trades:
        action = str(trade.get("action", "")).upper()
        symbol = str(trade.get("symbol", "UNKNOWN"))
        quantity = max(0, int(trade.get("quantity", 0) or 0))
        price = float(trade.get("price", 0) or 0)
        trade_date = _parse_date(trade.get("date"))

        if action == "BUY" and quantity and price > 0:
            open_lots[symbol].append({
                "quantity": quantity,
                "price": price,
                "date": trade_date,
            })
        elif action == "SELL" and quantity and price > 0:
            remaining = quantity
            while remaining and open_lots[symbol]:
                lot = open_lots[symbol][0]
                matched = min(remaining, lot["quantity"])
                days_held = (
                    (trade_date - lot["date"]).days
                    if trade_date and lot["date"] else None
                )
                closed_trades.append({
                    "symbol": symbol,
                    "quantity": matched,
                    "buy_price": lot["price"],
                    "sell_price": price,
                    "holding_days": max(0, days_held) if days_held is not None else None,
                    "realised_pnl": round((price - lot["price"]) * matched, 2),
                })
                lot["quantity"] -= matched
                remaining -= matched
                if lot["quantity"] == 0:
                    open_lots[symbol].popleft()

    reasons = [str(t.get("reason", "")).lower() for t in trades]
    impulsive_terms = ("fear missing out", "fomo", "trending online",
                       "positive online", "social-media spike",
                       "mentions and excitement", "rising quickly",
                       "sharp upward", "price breakout")
    fear_terms = ("panic", "worried", "sudden dip", "short-term fear",
                  "avoid further", "red trading", "losses increased",
                  "negative online", "price moved against")
    impulse_buys = [
        t for t in buys
        if any(term in str(t.get("reason", "")).lower() for term in impulsive_terms)
    ]
    fear_sells = [
        t for t in sells
        if any(term in str(t.get("reason", "")).lower() for term in fear_terms)
    ]

    total_buy_value = sum(
        float(t.get("price", 0) or 0) * int(t.get("quantity", 0) or 0)
        for t in buys
    )
    average_holding = [
        item["holding_days"] for item in closed_trades
        if item["holding_days"] is not None
    ]
    average_holding_days = (
        round(sum(average_holding) / len(average_holding), 1)
        if average_holding else None
    )
    wins = sum(1 for item in closed_trades if item["realised_pnl"] > 0)
    losses = sum(1 for item in closed_trades if item["realised_pnl"] < 0)
    realised_pnl = round(sum(item["realised_pnl"] for item in closed_trades), 2)

    symbols = defaultdict(int)
    for trade in trades:
        symbols[str(trade.get("symbol", "UNKNOWN"))] += 1
    most_traded_symbol = max(symbols, key=symbols.get) if symbols else None

    findings = []
    if impulse_buys:
        findings.append(
            f"{len(impulse_buys)} of {len(buys)} recorded buys contain language "
            "associated with momentum, online excitement, or fear of missing out."
        )
    if fear_sells:
        findings.append(
            f"{len(fear_sells)} of {len(sells)} recorded sells mention fear, "
            "a sudden dip, or a negative short-term move."
        )
    if average_holding_days is not None:
        findings.append(
            f"The average holding period for matched positions is "
            f"{average_holding_days} days using FIFO matching."
        )
    if most_traded_symbol:
        findings.append(f"{most_traded_symbol} is the most frequently traded symbol in this sample.")
    if not findings:
        findings.append("There is not enough descriptive evidence to identify a repeated behaviour.")

    result = {
        "investor_name": investor.get("investor_name", "Demo Investor"),
        "sample_size": len(trades),
        "buy_count": len(buys),
        "sell_count": len(sells),
        "active_trading_days": active_days,
        "trades_per_active_day": round(len(trades) / active_days, 2) if active_days else 0,
        "average_buy_value": round(total_buy_value / len(buys), 2) if buys else 0,
        "average_holding_days": average_holding_days,
        "matched_sell_quantity": sum(item["quantity"] for item in closed_trades),
        "profitable_matches": wins,
        "loss_making_matches": losses,
        "realised_pnl": realised_pnl,
        "impulse_buy_count": len(impulse_buys),
        "impulse_buy_rate": _percent(len(impulse_buys), len(buys)),
        "fear_based_sell_count": len(fear_sells),
        "fear_based_sell_rate": _percent(len(fear_sells), len(sells)),
        "most_traded_symbol": most_traded_symbol,
        "symbol_activity": dict(symbols),
        "behaviour_indicators": {
            "momentum_or_hype_entries": len(impulse_buys),
            "fear_or_dip_exits": len(fear_sells),
            "interpretation": "Text-based indicators from the recorded reasons, not a psychological assessment."
        },
        "closed_trade_sample": closed_trades[-10:],
        "open_positions": {
            symbol: sum(lot["quantity"] for lot in lots)
            for symbol, lots in open_lots.items() if lots
        }
    }

    limitations = [
        "All investor records are fictional and simulated.",
        "Trade reasons are user-entered descriptions and may be incomplete or subjective.",
        "FIFO matching is a simplified accounting assumption; fees, taxes, and partial fills are not modelled.",
        "The indicators describe this sample only and are not a personality diagnosis or investment recommendation."
    ]
    return {
        "feature": "investor_dna",
        "data_mode": "simulated",
        "result": result,
        "explanation": {
            "summary": "A descriptive profile of recorded trading habits, calculated from the simulated trade history.",
            "key_findings": findings,
            "limitations": limitations,
            "confidence": "Descriptive calculation on the supplied sample; not predictive."
        }
    }
