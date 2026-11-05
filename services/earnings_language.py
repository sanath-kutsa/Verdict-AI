VAGUE_PHRASES = (
    "we are evaluating", "still evaluating", "under review", "reviewing the causes",
    "in a future update", "at a later stage", "cannot provide", "not in a position to",
    "depends on market conditions", "working through these issues",
    "more slowly than expected", "mixed quarter", "subject to change",
)
CAUTIOUS_PHRASES = (
    "may", "might", "could", "expect to", "we believe", "currently",
    "not changing our guidance", "market conditions",
)


def analyse_earnings_language(investor, company=None, transcript_text=None, quarter=None):
    """Flag cautious or vague transcript wording without judging truthfulness."""
    selected = None
    if transcript_text is None:
        transcripts = investor.get("earnings_transcripts", [])
        target = str(company or "").strip().upper()
        matches = [
            item for item in transcripts
            if not target or str(item.get("company", "")).upper() == target
        ]
        if matches:
            selected = matches[0]
            transcript_text = selected.get("text", "")
    else:
        transcript_text = str(transcript_text)

    text_value = str(transcript_text or "")
    lowered = text_value.lower()
    flags = []
    for phrase in VAGUE_PHRASES:
        if phrase in lowered:
            flags.append({
                "phrase": phrase,
                "category": "vague_or_non_specific",
                "note": "This wording may leave timing, detail, or accountability unclear."
            })
    for phrase in CAUTIOUS_PHRASES:
        if phrase in lowered and not any(item["phrase"] == phrase for item in flags):
            flags.append({
                "phrase": phrase,
                "category": "cautious_language",
                "note": "This wording expresses uncertainty or qualifies the statement."
            })

    resolved_company = (
        str(company).upper() if company else
        selected.get("company") if selected else "CUSTOM_TRANSCRIPT"
    )
    resolved_quarter = quarter or (selected.get("quarter") if selected else None)
    findings = [
        f'Flagged phrase "{item["phrase"]}": {item["note"]}'
        for item in flags
    ]
    if not findings:
        findings.append("No phrases from the configured wording lists were found in this transcript sample.")

    return {
        "feature": "earnings_language_analyser",
        "data_mode": "simulated",
        "result": {
            "company": resolved_company,
            "quarter": resolved_quarter,
            "transcript_available": bool(text_value.strip()),
            "flag_count": len(flags),
            "flags": flags,
            "transcript_word_count": len(text_value.split()),
            "analysis_label": "Communication clarity review, not lie detection",
        },
        "explanation": {
            "summary": (
                f"The analyser reviewed the supplied {resolved_company} transcript sample and flagged {len(flags)} wording patterns."
                if text_value.strip() else
                "No transcript text was available for analysis."
            ),
            "key_findings": findings,
            "limitations": [
                "All bundled transcripts are fictional and simulated; custom text is analysed as supplied.",
                "Cautious or vague wording can be appropriate and does not establish dishonesty.",
                "The analyser uses a small phrase-matching list and may miss context, sarcasm, or equivalent wording.",
                "It does not detect lies, verify claims, or provide investment advice."
            ],
            "confidence": "Exact phrase matching only; no judgement about truthfulness is made."
        }
    }
