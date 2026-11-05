from flask import Flask, jsonify
from services.demo_data import load_investor_data

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
    })


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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
