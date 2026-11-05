from flask import Flask, jsonify, render_template, request
from services.demo_data import load_investor_data
from services.investor_dna import analyse_investor_dna
from services.circuit_breaker import analyse_circuit_breaker
from services.stress_test import run_stress_test
from services.regret_replay import replay_sells
from services.hype_radar import analyse_hype

app = Flask(__name__)


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


@app.get("/")
def home():
    return jsonify({
        "name": "Verdict AI",
        "tagline": "Decide before you trade.",
        "status": "Backend is running",
        "data_mode": "simulated",
        "available_features": [
            "investor_dna",
            "circuit_breaker",
            "stress_test",
            "regret_replay",
            "hype_radar"
        ]
    })


@app.route("/login")
@app.route("/login.html")
def login_page():
    return render_template("login.html")


@app.route("/signup")
@app.route("/signup.html")
def signup_page():
    return render_template("signup.html")


@app.route("/dashboard")
@app.route("/dashboard.html")
def dashboard_page():
    return render_template("dashboard.html")


@app.route("/about")
@app.route("/about.html")
def about_page():
    return render_template("about.html")


@app.route("/terms")
@app.route("/terms.html")
def terms_page():
    return render_template("terms.html")


@app.route("/disclaimer")
@app.route("/disclaimer.html")
def disclaimer_page():
    return render_template("disclaimer.html")


@app.route("/<path:page_name>")
def template_page(page_name):
    template_file = page_name if page_name.endswith(".html") else f"{page_name}.html"
    import os
    if not os.path.exists(os.path.join("templates", template_file)):
        return "Page not found", 404
    return render_template(template_file)


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Verdict AI backend is running."})


@app.get("/api/dashboard")
def dashboard():
    investor = load_investor_data()
    trades = investor.get("trades", [])

    result = {
        "investor_name": investor.get("investor_name", "Demo Investor"),
        "total_trades": len(trades),
        "recent_trades": trades[-5:],
    }

    response = make_response(
        feature="dashboard",
        result=result,
        summary="Dashboard data loaded from the fictional investor profile.",
        key_findings=[f"{len(trades)} simulated trades are available for analysis."],
    )
    return jsonify(response)


@app.get("/api/investor-dna")
def investor_dna():
    investor = load_investor_data()
    return jsonify(analyse_investor_dna(investor))


@app.route("/api/circuit-breaker", methods=["GET", "POST"])
def circuit_breaker():
    investor = load_investor_data()
    proposed_trade = request.get_json(silent=True) if request.method == "POST" else None
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
    investor = load_investor_data()
    if request.method == "POST":
        payload = request.get_json(silent=True) or {}
        change_pct = payload.get("scenario_change_pct", -10)
    else:
        change_pct = request.args.get("scenario_change_pct", default=-10, type=float)
    return jsonify(run_stress_test(investor, change_pct))


@app.get("/api/regret-replay")
def regret_replay():
    investor = load_investor_data()
    return jsonify(replay_sells(investor))


@app.get("/api/hype-radar")
def hype_radar():
    investor = load_investor_data()
    multiplier = request.args.get("spike_multiplier", default=2.0, type=float)
    return jsonify(analyse_hype(investor, multiplier))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
