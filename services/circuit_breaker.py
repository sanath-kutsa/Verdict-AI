from datetime import date


MOMENTUM_TERMS = (
    "fear of missing out", "fomo", "trending", "online posts",
    "social-media", "mentions", "rising quickly", "price jump",
    "breakout", "hype", "excited"
)
FEAR_TERMS = (
    "panic", "worried", "fear", "sudden dip", "price dip",
    "red session", "avoid further losses", "negative online",
    "losses increased"
)


def _contains_any(text, terms):
    value = str(text or "").lower()
    return any(term in value for term in terms)


def analyse_circuit_breaker(investor, proposed_trade=None):
    """Compare a proposed simulated trade with recorded behaviour patterns."""
    trades = investor.get("trades", [])
    proposal = proposed_trade or {}
    action = str(proposal.get("action", "BUY")).upper()
    symbol = str(proposal.get("symbol", "NOVA")).upper()
    reason = str(proposal.get("reason", "A simulated momentum entry"))
    quantity = proposal.get("quantity", 1)
    price = proposal.get("price")
    emotional_state = str(proposal.get("emotional_state", "Not supplied"))
    confidence = str(proposal.get("confidence", "Not supplied"))

    warnings = []
    if action not in ("BUY", "SELL"):
        return {
            "feature": "circuit_breaker",
            "data_mode": "simulated",
            "result": {"valid": False, "warnings": ["Action must be BUY or SELL."]},
            "explanation": {
                "summary": "The proposed action could not be analysed.",
                "key_findings": [],
                "limitations": ["Only simulated BUY and SELL examples are supported."],
                "confidence": "Not evaluated"
            }
        }

    try:
        quantity = float(quantity)
        if quantity <= 0:
            raise ValueError
    except (TypeError, ValueError):
        quantity = 0
        warnings.append("Enter a positive quantity to evaluate this proposal.")

    if price is not None:
        try:
            price = float(price)
            if price <= 0:
                raise ValueError
        except (TypeError, ValueError):
            price = None
            warnings.append("The proposed price is missing or invalid.")

    buys = [t for t in trades if str(t.get("action", "")).upper() == "BUY"]
    sells = [t for t in trades if str(t.get("action", "")).upper() == "SELL"]
    momentum_buys = [t for t in buys if _contains_any(t.get("reason"), MOMENTUM_TERMS)]
    fear_sells = [t for t in sells if _contains_any(t.get("reason"), FEAR_TERMS)]

    flags = []
    if action == "BUY" and _contains_any(reason, MOMENTUM_TERMS):
        flags.append({
            "code": "MOMENTUM_OR_HYPE_ENTRY",
            "severity": "review",
            "message": "The stated reason resembles momentum or online-hype entries in the demo history."
        })
    if emotional_state.lower() in ("excited", "anxious", "frustrated", "fearful"):
        flags.append({
            "code": "EMOTIONAL_STATE_REPORTED",
            "severity": "notice",
            "message": f"You reported feeling {emotional_state.lower()} while considering this trade; consider whether that state is affecting the decision."
        })
    if confidence.lower() == "very high":
        flags.append({
            "code": "HIGH_CONFIDENCE_CHECK",
            "severity": "notice",
            "message": "Very high confidence was reported. Check what evidence could disprove the trade thesis."
        })
    if action == "SELL" and _contains_any(reason, FEAR_TERMS):
        flags.append({
            "code": "FEAR_DRIVEN_EXIT",
            "severity": "review",
            "message": "The stated reason resembles fear-driven exits in the demo history."
        })

    if action == "BUY" and momentum_buys:
        flags.append({
            "code": "REPEATED_HISTORICAL_PATTERN",
            "severity": "notice",
            "message": f"{len(momentum_buys)} historical buys contain momentum or hype-related wording."
        })
    if action == "SELL" and fear_sells:
        flags.append({
            "code": "REPEATED_HISTORICAL_PATTERN",
            "severity": "notice",
            "message": f"{len(fear_sells)} historical sells contain fear or dip-related wording."
        })

    same_symbol = [t for t in trades if str(t.get("symbol", "")).upper() == symbol]
    if same_symbol:
        latest = max(same_symbol, key=lambda t: str(t.get("date", "")))
        flags.append({
            "code": "RECENT_SYMBOL_ACTIVITY",
            "severity": "notice",
            "message": f"The simulated history already contains activity in {symbol}; latest recorded activity was {latest.get('date', 'undated')}."
        })

    if not flags:
        flags.append({
            "code": "NO_RULE_TRIGGERED",
            "severity": "info",
            "message": "No configured behavioural warning was triggered by the supplied reason."
        })

    risk_level = "review" if any(f["severity"] == "review" for f in flags) else "notice" if any(f["severity"] == "notice" for f in flags) else "clear"
    result = {
        "valid": quantity > 0,
        "proposed_trade": {
            "symbol": symbol,
            "action": action,
            "quantity": quantity,
            "price": price,
            "reason": reason,
            "emotional_state": emotional_state,
            "confidence": confidence
        },
        "risk_level": risk_level,
        "flags": flags,
        "historical_context": {
            "recorded_buy_count": len(buys),
            "momentum_or_hype_buy_count": len(momentum_buys),
            "recorded_sell_count": len(sells),
            "fear_or_dip_sell_count": len(fear_sells)
        }
    }
    return {
        "feature": "circuit_breaker",
        "data_mode": "simulated",
        "result": result,
        "explanation": {
            "summary": "A rule-based pause screen compares the proposed trade description with patterns in the fictional trade log.",
            "key_findings": [flag["message"] for flag in flags],
            "limitations": [
                "All trade records are fictional and simulated.",
                "Warnings are keyword-based and can miss context or misunderstand wording.",
                "This tool does not assess whether a trade is suitable, predict prices, or provide financial advice."
            ],
            "confidence": "Rule-based pattern match only; not a prediction."
        }
    }
