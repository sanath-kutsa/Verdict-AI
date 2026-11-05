from collections import defaultdict


def analyse_hype(investor, spike_multiplier=2.0, theme=None, signal_source=None, narrative=None):
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

    narrative_text = str(narrative or "").strip()
    narrative_lower = narrative_text.lower()
    hype_terms = ("guaranteed", "indefinitely", "everyone is buying", "cannot lose", "to the moon", "explosive", "get rich", "sure thing", "will dominate")
    uncertainty_terms = ("may", "might", "could", "risk", "uncertain", "competition", "valuation", "margin", "debt", "regulation")
    hype_hits = [term for term in hype_terms if term in narrative_lower]
    caution_hits = [term for term in uncertainty_terms if term in narrative_lower]
    narrative_score = min(100, len(hype_hits) * 20 + max(0, 30 - len(caution_hits) * 5)) if narrative_text else None
    narrative_findings = []
    if narrative_text:
        narrative_findings.append(f"Submitted narrative length: {len(narrative_text.split())} words.")
        narrative_findings.append("Potential promotional wording: " + (", ".join(hype_hits) if hype_hits else "none detected by the configured phrase list") + ".")
        narrative_findings.append("Risk or uncertainty wording: " + (", ".join(caution_hits) if caution_hits else "none detected by the configured phrase list") + ".")
    result = {
        "theme": str(theme or "")[:120],
        "signal_source": str(signal_source or "")[:80],
        "narrative_analysis": {"score": narrative_score, "promotional_terms": hype_hits, "risk_terms": caution_hits, "word_count": len(narrative_text.split())},
        "spike_multiplier_threshold": multiplier,
        "symbols_analysed": len(symbols),
        "spike_count": spike_count,
        "symbols": symbols
    }
    findings = [
        f"{spike_count} mention spike(s) met or exceeded the {multiplier:.1f}x prior-average threshold."
    ] + narrative_findings
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
            "summary": "The analyser checks the submitted narrative for configured promotional and risk terms, and compares any available local mention observations with their earlier average.",
            "key_findings": findings,
            "limitations": [
                "Mention counts are from the local sample dataset; narrative phrase checks use only the text submitted in this request. No external social feed is queried.",
                "A mention spike does not establish coordinated activity, manipulation, or a likely price move.",
                "The dataset is sparse and the baseline changes as more observations are added.",
                "The phrase list is a simple heuristic, not a sentiment model or independently verified social analysis."
            ],
            "confidence": "Transparent threshold calculation on a small simulated sample; not a market signal."
        }
    }
