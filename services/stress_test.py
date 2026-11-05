from collections import defaultdict


def _open_positions(trades):
    positions = defaultdict(float)
    for trade in trades:
        symbol = str(trade.get("symbol", "UNKNOWN")).upper()
        quantity = float(trade.get("quantity", 0) or 0)
        action = str(trade.get("action", "")).upper()
        if action == "BUY":
            positions[symbol] += quantity
        elif action == "SELL":
            positions[symbol] -= quantity
    return {symbol: qty for symbol, qty in positions.items() if qty > 0}


def run_stress_test(investor, scenario_change_pct=-10.0, position=None):
    """Apply a hypothetical uniform price shock to simulated open positions."""
    try:
        change_pct = float(scenario_change_pct)
    except (TypeError, ValueError):
        change_pct = -10.0

    if change_pct < -100 or change_pct > 100:
        return {
            "feature": "stress_test",
            "data_mode": "simulated",
            "result": {"valid": False, "scenario_change_pct": change_pct},
            "explanation": {
                "summary": "Scenario is outside the supported range.",
                "key_findings": ["Choose a hypothetical percentage between -100% and +100%."],
                "limitations": ["This is a simplified educational simulation."],
                "confidence": "Not evaluated"
            }
        }

    positions = _open_positions(investor.get("trades", []))
    history = investor.get("price_history", {})
    if position:
        symbol = str(position.get("symbol", "")).strip().upper()
        try:
            quantity = float(position.get("quantity"))
            reference_price = float(position.get("current_price"))
        except (TypeError, ValueError):
            raise ValueError("Enter a valid symbol, quantity, and reference price for the stress test.")
        if not symbol or quantity <= 0 or reference_price <= 0:
            raise ValueError("Symbol, quantity, and reference price must be valid positive values.")
        positions = {symbol: quantity}
        history = {symbol: [{"date": "user-supplied", "close": reference_price}]}
    rows = []
    current_total = 0.0
    stressed_total = 0.0
    trades_by_symbol = defaultdict(list)
    for trade in investor.get("trades", []):
        trades_by_symbol[str(trade.get("symbol", "")).upper()].append(trade)

    for symbol, quantity in sorted(positions.items()):
        observations = history.get(symbol, [])
        reference_source = "user_supplied_reference_price" if observations and observations[0].get("date") == "user-supplied" else "bundled_simulated_price_history"
        if observations:
            latest = max(observations, key=lambda item: str(item.get("date", "")))
            latest_price = float(latest.get("close", 0) or 0)
            reference_date = latest.get("date")
        else:
            # A user's own last simulated execution is a transparent fallback
            # when the bundled market sample has no quote for that symbol.
            latest_trade = max(
                trades_by_symbol.get(symbol, []),
                key=lambda item: str(item.get("date", "")),
                default=None,
            )
            if not latest_trade:
                continue
            latest_price = float(latest_trade.get("price", 0) or 0)
            reference_date = latest_trade.get("date")
            reference_source = "last_recorded_simulated_trade_price"
        if latest_price <= 0:
            continue
        current_value = quantity * latest_price
        stressed_price = latest_price * (1 + change_pct / 100)
        stressed_value = quantity * stressed_price
        current_total += current_value
        stressed_total += stressed_value
        rows.append({
            "symbol": symbol,
            "quantity": round(quantity, 4),
            "reference_date": reference_date,
            "reference_source": reference_source,
            "simulated_reference_price": round(latest_price, 2),
            "hypothetical_price": round(stressed_price, 2),
            "current_simulated_value": round(current_value, 2),
            "hypothetical_value": round(stressed_value, 2),
            "change_value": round(stressed_value - current_value, 2)
        })

    result = {
        "scenario_change_pct": round(change_pct, 2),
        "currency": investor.get("currency", "INR"),
        "positions": rows,
        "current_simulated_portfolio_value": round(current_total, 2),
        "hypothetical_portfolio_value": round(stressed_total, 2),
        "hypothetical_change_value": round(stressed_total - current_total, 2),
        "hypothetical_change_pct": round(change_pct, 2) if current_total else 0.0
    }
    return {
        "feature": "stress_test",
        "data_mode": "simulated",
        "result": result,
        "explanation": {
            "summary": f"A hypothetical {change_pct:+.1f}% price change was applied to the selected position or saved paper-trade holdings.",
            "key_findings": [
                f"{len(rows)} simulated open positions were included.",
                f"The calculated portfolio value changes by {stressed_total - current_total:,.2f} {investor.get('currency', 'INR')} under this simplified scenario."
            ],
            "limitations": [
                "Positions and reference prices are supplied by the user or loaded from the local paper-trade dataset; they are not live quotes.",
                "The scenario assumes every included holding moves by the same percentage at the same time.",
                "It excludes fees, taxes, liquidity, correlations, derivatives, cash balances, and real-world market behaviour.",
                "This is an educational what-if calculation, not a forecast or financial advice."
            ],
            "confidence": "Arithmetic scenario calculation only; the scenario itself is hypothetical."
        }
    }
