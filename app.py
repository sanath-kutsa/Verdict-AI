from flask import Flask, jsonify, render_template, request
from services.demo_data import load_investor_data
from services.database import (
    init_db, create_guest_user, get_user, get_user_trades,
    add_trade, get_portfolio
)
from services.investor_dna import analyse_investor_dna
from services.circuit_breaker import analyse_circuit_breaker
from services.stress_test import run_stress_test
from services.regret_replay import replay_sells
from services.hype_radar import analyse_hype
from services.move_autopsy import analyse_move
from services.bull_bear import build_bull_bear
from services.earnings_language import analyse_earnings_language

app = Flask(__name__)
init_db()


def make_response(feature, result, summary, key_findings=None, limitations=None, confidence="Demo only"):
    return {
        "feature": feature,
        "data_mode": "simulated",
        "result": result,
        "explanation": {
            "summary": summary,
            "key_findings": key_findings or [],
            "limitations": limitations or ["This prototype uses fictional demonstration data."],
            "confidence": confidence,
        },
    }


def get_investor_payload(payload=None):
    """Load a supplied dataset, a user's saved trades, or the bundled demo."""
    if isinstance(payload, dict) and isinstance(payload.get("investor"), dict):
        return payload["investor"]

    user_id = payload.get("user_id") if hasattr(payload, "get") else None
    if user_id is not None:
        user = get_user(user_id)
        if not user:
            raise LookupError("User not found.")
        investor = load_investor_data()
        investor["investor_name"] = user["name"]
        investor["trades"] = get_user_trades(user_id)
        return investor

    return load_investor_data()


@app.errorhandler(LookupError)
def handle_not_found(error):
    return jsonify({"error": str(error)}), 404


@app.errorhandler(ValueError)
def handle_bad_request(error):
    return jsonify({"error": str(error)}), 400


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/login")
def login_page():
    return render_template("login.html")


@app.get("/dashboard")
def dashboard_page():
    return render_template("dashboard.html")


@app.get("/<path:page_name>")
def template_page(page_name):
    template_file = page_name if page_name.endswith(".html") else f"{page_name}.html"
    try:
        return render_template(template_file)
    except Exception:
        return "Page not found", 404


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Verdict AI backend is running."})


@app.post("/api/users/guest")
def create_guest():
    payload = request.get_json(silent=True) or {}
    user = create_guest_user(payload.get("name", "Demo Investor"))
    return jsonify({
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        },
        "data_mode": "simulated",
        "message": "Demo account created. Save this user ID for later requests."
    }), 201


@app.get("/api/users/<int:user_id>")
def user_details(user_id):
    user = get_user(user_id)
    if not user:
        raise LookupError("User not found.")
    return jsonify({
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        },
        "data_mode": "simulated",
    })


@app.route("/api/users/<int:user_id>/trades", methods=["GET", "POST"])
def user_trades(user_id):
    if not get_user(user_id):
        raise LookupError("User not found.")
    if request.method == "GET":
        return jsonify({
            "user_id": user_id,
            "trades": get_user_trades(user_id),
            "data_mode": "simulated",
        })

    payload = request.get_json(silent=True) or {}
    required = ("symbol", "action", "quantity", "price")
    missing = [field for field in required if payload.get(field) is None]
    if missing:
        raise ValueError("Missing required fields: " + ", ".join(missing))
    trade = add_trade(
        user_id=user_id,
        symbol=payload.get("symbol"),
        action=payload.get("action"),
        quantity=payload.get("quantity"),
        price=payload.get("price"),
        reason=payload.get("reason", ""),
        trade_date=payload.get("date"),
    )
    return jsonify({
        "trade": trade,
        "portfolio": get_portfolio(user_id),
        "data_mode": "simulated",
    }), 201


@app.get("/api/users/<int:user_id>/portfolio")
def user_portfolio(user_id):
    portfolio = get_portfolio(user_id)
    if portfolio is None:
        raise LookupError("User not found.")
    return jsonify(portfolio)


@app.get("/api/dashboard")
def dashboard():
    investor = get_investor_payload(request.args)
    trades = investor.get("trades", [])
    result = {
        "investor_name": investor.get("investor_name", "Demo Investor"),
        "total_trades": len(trades),
        "recent_trades": trades[-5:],
    }
    return jsonify(make_response(
        feature="dashboard",
        result=result,
        summary="Dashboard data loaded from the fictional investor profile.",
        key_findings=[f"{len(trades)} simulated trades are available for analysis."],
    ))


@app.route("/api/investor-dna", methods=["GET", "POST"])
def investor_dna():
    payload = request.get_json(silent=True) if request.method == "POST" else request.args
    investor = get_investor_payload(payload)
    return jsonify(analyse_investor_dna(investor))


@app.route("/api/circuit-breaker", methods=["GET", "POST"])
def circuit_breaker():
    payload = request.get_json(silent=True) if request.method == "POST" else request.args
    investor = get_investor_payload(payload)
    proposed_trade = payload.get("proposed_trade", payload) if isinstance(payload, dict) else None
    if request.method == "GET":
        proposed_trade = {
            "symbol": request.args.get("symbol", "NOVA"),
            "action": request.args.get("action", "BUY"),
            "quantity": request.args.get("quantity", default=5, type=float),
            "price": request.args.get("price", default=130, type=float),
            "reason": request.args.get("reason", "Bought after a sharp price jump; feared missing out")
        }
    return jsonify(analyse_circuit_breaker(investor, proposed_trade or {}))


@app.route("/api/stress-test", methods=["GET", "POST"])
def stress_test():
    payload = request.get_json(silent=True) if request.method == "POST" else request.args
    investor = get_investor_payload(payload)
    if request.method == "POST":
        change_pct = payload.get("scenario_change_pct", -10) if isinstance(payload, dict) else -10
    else:
        change_pct = request.args.get("scenario_change_pct", default=-10, type=float)
    return jsonify(run_stress_test(investor, change_pct))


@app.route("/api/regret-replay", methods=["GET", "POST"])
def regret_replay():
    payload = (request.get_json(silent=True) if request.method == "POST" else request.args) or {}
    investor = get_investor_payload(payload)
    return jsonify(replay_sells(
        investor,
        trade_type=payload.get("trade_type"),
        lookback_days=payload.get("lookback_days"),
        review_note=payload.get("review_note"),
    ))


@app.route("/api/hype-radar", methods=["GET", "POST"])
def hype_radar():
    payload = request.get_json(silent=True) if request.method == "POST" else request.args
    investor = get_investor_payload(payload)
    multiplier = (
        payload.get("spike_multiplier", 2.0)
        if isinstance(payload, dict) and request.method == "POST"
        else request.args.get("spike_multiplier", default=2.0, type=float)
    )
    return jsonify(analyse_hype(investor, multiplier))


@app.route("/api/move-autopsy", methods=["GET", "POST"])
def move_autopsy():
    payload = request.get_json(silent=True) if request.method == "POST" else request.args
    investor = get_investor_payload(payload)
    symbol = (
        payload.get("symbol", "NOVA")
        if isinstance(payload, dict) and request.method == "POST"
        else request.args.get("symbol", "NOVA")
    )
    return jsonify(analyse_move(investor, symbol))


@app.route("/api/bull-vs-bear", methods=["GET", "POST"])
def bull_vs_bear():
    payload = request.get_json(silent=True) if request.method == "POST" else request.args
    investor = get_investor_payload(payload)
    symbol = (
        payload.get("symbol", "NOVA")
        if isinstance(payload, dict) and request.method == "POST"
        else request.args.get("symbol", "NOVA")
    )
    bull_thesis = payload.get("bull_thesis") if isinstance(payload, dict) else None
    bear_thesis = payload.get("bear_thesis") if isinstance(payload, dict) else None
    return jsonify(build_bull_bear(investor, symbol, bull_thesis, bear_thesis))


@app.route("/api/earnings-language", methods=["GET", "POST"])
def earnings_language():
    payload = request.get_json(silent=True) if request.method == "POST" else request.args
    payload = payload if hasattr(payload, "get") else {}
    investor = get_investor_payload(payload)
    return jsonify(analyse_earnings_language(
        investor,
        company=payload.get("company") or request.args.get("company"),
        transcript_text=payload.get("transcript_text"),
        quarter=payload.get("quarter"),
    ))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
