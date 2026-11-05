from services.market_evidence import build_market_evidence


def analyse_move(investor, symbol="NOVA", move_type=None, move_context=None, price_change_pct=None, volume_multiple=None, catalyst=None):
    """Explain observed movement using only the supplied simulated evidence."""
    evidence = build_market_evidence(investor, symbol)
    price = evidence["price_history"]
    social = evidence["social_attention"]
    fundamentals = evidence["fundamentals"]
    drivers = []

    latest_change = price["latest_change_pct"]
    sample_change = price["sample_change_pct"]
    if latest_change is not None:
        direction = "rose" if latest_change > 0 else "fell" if latest_change < 0 else "was unchanged"
        drivers.append({
            "category": "price_momentum",
            "signal": "positive" if latest_change > 0 else "negative" if latest_change < 0 else "neutral",
            "finding": f"The latest sample observation {direction} {abs(latest_change):.2f}% versus the previous observation.",
            "value_pct": latest_change,
        })
    if sample_change is not None:
        drivers.append({
            "category": "sample_trend",
            "signal": "positive" if sample_change > 0 else "negative" if sample_change < 0 else "neutral",
            "finding": f"Across the available sample, the recorded price changed {sample_change:+.2f}%.",
            "value_pct": sample_change,
        })

    multiple = social["latest_vs_prior_multiple"]
    if multiple is not None:
        unusual = multiple >= 2.0
        drivers.append({
            "category": "social_attention",
            "signal": "attention_spike" if unusual else "ordinary",
            "finding": (
                f"Latest social mentions were {multiple:.2f} times the average of earlier sample observations."
                if unusual else
                f"Latest social mentions were {multiple:.2f} times the earlier sample average; this does not meet the 2x attention-spike rule."
            ),
            "multiple_of_prior_average": multiple,
            "latest_sentiment_score": social["latest"]["sentiment"] if social["latest"] else None,
        })
    if fundamentals:
        for field, label, positive_test in (
            ("revenue_growth_pct", "Revenue growth", lambda value: value > 0),
            ("operating_margin_pct", "Operating margin", lambda value: value > 0),
            ("debt_to_equity", "Debt-to-equity", lambda value: value < 1),
        ):
            try:
                value = float(fundamentals[field])
            except (KeyError, TypeError, ValueError):
                continue
            drivers.append({
                "category": "fundamentals",
                "signal": "supportive" if positive_test(value) else "caution",
                "finding": f"Illustrative {label.lower()} metric: {value:.2f}{'%' if field.endswith('_pct') else ''}.",
                "metric": field,
                "value": value,
            })
        if fundamentals.get("guidance_note"):
            drivers.append({
                "category": "management_guidance",
                "signal": "context",
                "finding": str(fundamentals["guidance_note"]),
            })

    if price_change_pct is not None:
        try:
            observed_change = float(price_change_pct)
            move_label = str(move_type or "price").lower()
            drivers.append({"category": "user_supplied_price_move", "signal": "positive" if observed_change > 0 else "negative" if observed_change < 0 else "neutral", "finding": f"User-supplied {move_label} change: {observed_change:+.2f}%.", "value_pct": observed_change})
        except (TypeError, ValueError):
            raise ValueError("Observed price change must be a number.")
    if volume_multiple is not None:
        try:
            volume_ratio = float(volume_multiple)
            if volume_ratio <= 0:
                raise ValueError
            drivers.append({"category": "user_supplied_volume", "signal": "attention" if volume_ratio >= 1.5 else "ordinary", "finding": f"User-supplied volume was {volume_ratio:.2f}x the stated average.", "multiple": volume_ratio})
        except (TypeError, ValueError):
            raise ValueError("Volume multiple must be greater than zero.")
    if catalyst and str(catalyst).strip():
        drivers.append({"category": "user_supplied_catalyst", "signal": "context", "finding": "User-reported catalyst: " + str(catalyst).strip()[:300]})
    if move_context and str(move_context).strip():
        drivers.append({"category": "user_supplied_context", "signal": "context", "finding": "User-provided context: " + str(move_context).strip()[:700]})
    if not drivers:
        summary = f"No usable simulated evidence was found for {evidence['symbol']}."
    else:
        summary = (
            f"Move Autopsy reviewed {len(drivers)} evidence signals for {evidence['symbol']}. "
            "These signals describe the sample and do not establish why a real market price moved."
        )

    return {
        "feature": "move_autopsy",
        "data_mode": "simulated",
        "result": {
            "symbol": evidence["symbol"],
            "currency": evidence["currency"],
            "drivers": drivers,
            "evidence": evidence,
            "evidence_count": len(drivers),
        },
        "explanation": {
            "summary": summary,
            "key_findings": [item["finding"] for item in drivers],
            "limitations": [
                "Bundled market evidence is illustrative; separately labelled observations and context are user-supplied and have not been independently verified.",
                "A relationship between attention and price movement does not prove causation.",
                "The sample is sparse and may omit important events or contradictory information.",
                "This is an educational explanation, not a forecast or financial advice."
            ],
            "confidence": "Descriptive analysis of the supplied sample only; causal confidence is not established."
        }
    }
