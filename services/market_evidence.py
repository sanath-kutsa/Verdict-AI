def build_market_evidence(investor, symbol):
    """Build one shared evidence snapshot for Move Autopsy and Bull-vs-Bear."""
    symbol = str(symbol or "").strip().upper()
    history = investor.get("price_history", {}).get(symbol, [])
    prices = []
    for point in history:
        try:
            close = float(point.get("close", 0))
            if close > 0:
                prices.append({"date": point.get("date"), "close": close})
        except (TypeError, ValueError, AttributeError):
            continue
    prices.sort(key=lambda item: str(item.get("date", "")))

    price_evidence = {
        "observation_count": len(prices),
        "series": prices,
        "latest": prices[-1] if prices else None,
        "previous": prices[-2] if len(prices) > 1 else None,
        "latest_change_pct": None,
        "sample_change_pct": None,
    }
    if len(prices) > 1:
        previous = prices[-2]["close"]
        price_evidence["latest_change_pct"] = round(
            ((prices[-1]["close"] - previous) / previous) * 100, 2
        )
        first = prices[0]["close"]
        price_evidence["sample_change_pct"] = round(
            ((prices[-1]["close"] - first) / first) * 100, 2
        ) if first else None

    mentions = []
    for item in investor.get("social_mentions", []):
        if str(item.get("symbol", "")).upper() != symbol:
            continue
        try:
            count = max(0, int(item.get("mentions", 0)))
            sentiment = max(-1.0, min(1.0, float(item.get("sentiment", 0))))
        except (TypeError, ValueError, AttributeError):
            continue
        mentions.append({
            "date": item.get("date"),
            "mentions": count,
            "sentiment": sentiment,
        })
    mentions.sort(key=lambda item: str(item.get("date", "")))
    mention_evidence = {
        "observation_count": len(mentions),
        "series": mentions,
        "latest": mentions[-1] if mentions else None,
        "prior_average_mentions": None,
        "latest_vs_prior_multiple": None,
    }
    if len(mentions) > 1:
        baseline = sum(item["mentions"] for item in mentions[:-1]) / len(mentions[:-1])
        mention_evidence["prior_average_mentions"] = round(baseline, 2)
        if baseline > 0:
            mention_evidence["latest_vs_prior_multiple"] = round(
                mentions[-1]["mentions"] / baseline, 2
            )

    fundamentals = investor.get("fundamentals", {}).get(symbol)
    evidence = {
        "symbol": symbol,
        "currency": investor.get("currency", "INR"),
        "price_history": price_evidence,
        "social_attention": mention_evidence,
        "fundamentals": fundamentals if isinstance(fundamentals, dict) else None,
    }
    evidence_items = []
    if price_evidence["latest"] is not None:
        evidence_items.append({
            "source": "simulated_price_history",
            "observation": "Latest recorded sample price",
            "date": price_evidence["latest"]["date"],
            "value": price_evidence["latest"]["close"],
        })
    if price_evidence["latest_change_pct"] is not None:
        evidence_items.append({
            "source": "simulated_price_history",
            "observation": "Change from previous sample observation",
            "value_pct": price_evidence["latest_change_pct"],
        })
    if price_evidence["sample_change_pct"] is not None:
        evidence_items.append({
            "source": "simulated_price_history",
            "observation": "Change across available sample",
            "value_pct": price_evidence["sample_change_pct"],
        })
    if mention_evidence["latest"] is not None:
        evidence_items.append({
            "source": "simulated_social_mentions",
            "observation": "Latest mention count",
            "date": mention_evidence["latest"]["date"],
            "mentions": mention_evidence["latest"]["mentions"],
            "sentiment_score": mention_evidence["latest"]["sentiment"],
            "multiple_of_prior_average": mention_evidence["latest_vs_prior_multiple"],
        })
    if fundamentals:
        evidence_items.append({
            "source": "simulated_fundamentals",
            "observation": "Illustrative company metrics",
            "metrics": fundamentals,
        })
    evidence["evidence_items"] = evidence_items
    return evidence
