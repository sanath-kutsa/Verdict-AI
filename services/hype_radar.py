from collections import defaultdict


def analyse_hype(investor, spike_multiplier=2.0):
    """Flag unusually high simulated mention counts against prior observations."""
    try:
        multiplier = float(spike_multiplier)
    except (TypeError, ValueError):
        multiplier = 2.0
    if multiplier < 1.1 or multiplier > 10:
        multiplier = 2.0

    grouped = defaultdict(list)
    for item in investor.get("social_mentions", []):
        symbol = str(item.get("symbol", "UNKNOWN")).upper()
        try:
            mentions = max(0, int(item.get("mentions", 0)))
            sentiment = float(item.get("sentiment", 0))
        except (TypeError, ValueError):
            continue
        grouped[symbol].append({
            "date": item.get("date"),
            "mentions": mentions,
            "sentiment": max(-1.0, min(1.0, sentiment))
        })

    symbols = []
    spike_count = 0
    for symbol, observations in sorted(grouped.items()):
        observations.sort(key=lambda item: str(item.get("date", "")))
        symbol_spikes = []
        for index, point in enumerate(observations):
            previous = observations[:index]
            if not previous:
                continue
            baseline = sum(item["mentions"] for item in previous) / len(previous)
            if baseline > 0 and point["mentions"] >= baseline * multiplier:
                spike_count += 1
                symbol_spikes.append({
                    "date": point["date"],
                    "mentions": point["mentions"],
                    "prior_average_mentions": round(baseline, 2),
                    "spike_multiple": round(point["mentions"] / baseline, 2),
                    "sentiment_score": point["sentiment"]
                })
        symbols.append({
            "symbol": symbol,
            "observation_count": len(observations),
            "latest_observation": observations[-1] if observations else None,
            "spikes": symbol_spikes,
            "mention_series": observations
        })

    result = {
        "spike_multiplier_threshold": multiplier,
        "symbols_analysed": len(symbols),
        "spike_count": spike_count,
        "symbols": symbols
    }
    findings = [
        f"{spike_count} mention spike(s) met or exceeded the {multiplier:.1f}x prior-average threshold."
    ]
    for item in symbols:
        for spike in item["spikes"]:
            findings.append(
                f"{item['symbol']} recorded {spike['mentions']} mentions on {spike['date']}, "
                f"or {spike['spike_multiple']}x its earlier sample average."
            )
    if spike_count == 0:
        findings.append("No mention spike crossed the configured threshold in the available sample.")

    return {
        "feature": "hype_radar",
        "data_mode": "simulated",
        "result": result,
        "explanation": {
            "summary": "A simple anomaly screen compares each simulated mention count with the average of earlier observations for that symbol.",
            "key_findings": findings,
            "limitations": [
                "All social mention counts and sentiment scores are fictional and simulated.",
                "A mention spike does not establish coordinated activity, manipulation, or a likely price move.",
                "The dataset is sparse and the baseline changes as more observations are added.",
                "Sentiment is a supplied demo score, not independently verified language analysis."
            ],
            "confidence": "Transparent threshold calculation on a small simulated sample; not a market signal."
        }
    }
