from datetime import date


def replay_sells(investor):
    """Compare each simulated sell with the next later available sample price."""
    history = investor.get("price_history", {})
    replays = []
    total_difference = 0.0

    for trade in investor.get("trades", []):
        if str(trade.get("action", "")).upper() != "SELL":
            continue
        symbol = str(trade.get("symbol", "")).upper()
        sell_date_text = trade.get("date")
        try:
            sell_date = date.fromisoformat(sell_date_text)
            sell_price = float(trade.get("price", 0) or 0)
            quantity = float(trade.get("quantity", 0) or 0)
        except (TypeError, ValueError):
            continue
        if sell_price <= 0 or quantity <= 0:
            continue

        later = []
        for point in history.get(symbol, []):
            try:
                point_date = date.fromisoformat(point.get("date", ""))
                point_price = float(point.get("close", 0) or 0)
            except (TypeError, ValueError):
                continue
            if point_date > sell_date and point_price > 0:
                later.append((point_date, point_price))
        if not later:
            continue

        replay_date, replay_price = min(later, key=lambda item: item[0])
        per_unit_difference = replay_price - sell_price
        hypothetical_difference = per_unit_difference * quantity
        total_difference += hypothetical_difference
        replays.append({
            "trade_id": trade.get("id"),
            "symbol": symbol,
            "sell_date": sell_date_text,
            "sell_price": round(sell_price, 2),
            "next_observation_date": replay_date.isoformat(),
            "next_observation_price": round(replay_price, 2),
            "quantity": quantity,
            "price_difference_per_unit": round(per_unit_difference, 2),
            "hypothetical_difference": round(hypothetical_difference, 2),
            "direction": "higher_after_sell" if per_unit_difference > 0 else "lower_after_sell" if per_unit_difference < 0 else "unchanged"
        })

    replays.sort(key=lambda item: item["sell_date"])
    currency = investor.get("currency", "INR")
    return {
        "feature": "regret_replay",
        "data_mode": "simulated",
        "result": {
            "currency": currency,
            "replayed_sell_count": len(replays),
            "hypothetical_difference_total": round(total_difference, 2),
            "replays": replays
        },
        "explanation": {
            "summary": "A hindsight comparison of each eligible sell with the next later price observation available in the fictional dataset.",
            "key_findings": [
                f"{len(replays)} simulated sell events had a later price observation.",
                f"The sum of hypothetical differences at those next observations is {total_difference:,.2f} {currency}."
            ],
            "limitations": [
                "All trade records and price observations are fictional and simulated.",
                "The next observation may be days later and is not necessarily an achievable execution price.",
                "This hindsight exercise ignores fees, taxes, slippage, risk, and what information was available at the time.",
                "A higher later price does not prove that selling was a mistake; this is not a recommendation."
            ],
            "confidence": "Direct arithmetic comparison of sparse simulated observations; not predictive."
        }
    }
