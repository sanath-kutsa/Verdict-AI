from services.market_evidence import build_market_evidence


def build_bull_bear(investor, symbol="NOVA"):
    """Create balanced opposing cases from the exact same evidence snapshot."""
    evidence = build_market_evidence(investor, symbol)
    price = evidence["price_history"]
    social = evidence["social_attention"]
    fundamentals = evidence["fundamentals"]
    bull_points = []
    bear_points = []

    for label, value in (
        ("Latest sample movement", price["latest_change_pct"]),
        ("Change across sample", price["sample_change_pct"]),
    ):
        if value is None:
            continue
        if value > 0:
            bull_points.append(f"{label} is positive at {value:.2f}% in the simulated sample.")
            bear_points.append(f"The observed rise may not persist; the sample contains no guarantee of continuation.")
        elif value < 0:
            bear_points.append(f"{label} is negative at {value:.2f}% in the simulated sample.")
            bull_points.append(f"A decline can be framed as a possible recovery setup, but the supplied data does not confirm one.")
        else:
            bull_points.append(f"{label} is flat, so the sample does not show downward momentum for this measure.")
            bear_points.append(f"{label} is flat, so the sample does not show upward momentum for this measure.")

    multiple = social["latest_vs_prior_multiple"]
    if multiple is not None:
        sentiment = social["latest"]["sentiment"] if social["latest"] else 0
        if sentiment > 0:
            bull_points.append(f"Latest social sentiment is positive ({sentiment:.2f}) alongside the recorded attention level.")
        elif sentiment < 0:
            bear_points.append(f"Latest social sentiment is negative ({sentiment:.2f}), which may indicate caution in the sample.")
        if multiple >= 2:
            bear_points.append(f"Social mentions reached {multiple:.2f} times the earlier average; a spike can reflect short-lived hype rather than durable demand.")
            if sentiment > 0:
                bull_points.append(f"The {multiple:.2f}x mention increase shows elevated attention, although attention alone is not proof of business strength.")
        else:
            bear_points.append("The social sample does not show a 2x attention spike, so there is limited evidence of a sudden attention catalyst.")

    if fundamentals:
        try:
            growth = float(fundamentals.get("revenue_growth_pct"))
            (bull_points if growth > 0 else bear_points).append(
                f"Illustrative revenue growth is {growth:.2f}%."
            )
        except (TypeError, ValueError):
            pass
        try:
            margin = float(fundamentals.get("operating_margin_pct"))
            (bull_points if margin > 0 else bear_points).append(
                f"Illustrative operating margin is {margin:.2f}%."
            )
        except (TypeError, ValueError):
            pass
        try:
            debt = float(fundamentals.get("debt_to_equity"))
            (bear_points if debt >= 1 else bull_points).append(
                f"Illustrative debt-to-equity is {debt:.2f}; this simplified demo uses 1.00 as a discussion reference, not a universal threshold."
            )
        except (TypeError, ValueError):
            pass
        if fundamentals.get("guidance_note"):
            bear_points.append(f"Management context to examine: {fundamentals['guidance_note']}")

    if not bull_points:
        bull_points.append("The supplied sample contains too little evidence to form a strong positive case.")
    if not bear_points:
        bear_points.append("The supplied sample contains too little evidence to form a strong cautionary case.")

    return {
        "feature": "bull_vs_bear",
        "data_mode": "simulated",
        "result": {
            "symbol": evidence["symbol"],
            "bull_case": bull_points,
            "bear_case": bear_points,
            "shared_evidence": evidence,
            "balance_note": "Both sides were generated from the same evidence snapshot. Neither side is a prediction or recommendation."
        },
        "explanation": {
            "summary": f"Two opposing interpretations were assembled for {evidence['symbol']} using the same simulated evidence.",
            "key_findings": [
                f"{len(bull_points)} points appear in the bull case.",
                f"{len(bear_points)} points appear in the bear case.",
                f"{len(evidence['evidence_items'])} shared evidence items were considered."
            ],
            "limitations": [
                "All values and company details are fictional and simulated.",
                "The cases are rule-based perspectives, not independent research or verified analyst opinions.",
                "The same evidence can support different interpretations; missing information may materially change either case.",
                "This is an educational comparison, not a forecast or financial advice."
            ],
            "confidence": "Evidence extraction is deterministic; interpretation is illustrative and not predictive."
        }
    }
