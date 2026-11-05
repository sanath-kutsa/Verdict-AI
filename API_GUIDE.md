# Verdict AI API Guide

All endpoints return JSON. The project currently uses fictional, simulated data only.

## Run locally

```powershell
py -m pip install -r requirements.txt
py app.py
```

The Flask development server is available at `http://localhost:5000` or the local network address printed in the terminal.

## Common response shape

Feature endpoints use this structure:

```json
{
  "feature": "feature_name",
  "data_mode": "simulated",
  "result": {},
  "explanation": {
    "summary": "",
    "key_findings": [],
    "limitations": [],
    "confidence": ""
  }
}
```

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check whether the backend is running |
| GET | `/api/dashboard` | Dashboard summary and recent trades |
| GET, POST | `/api/investor-dna` | Describe patterns in the supplied trade history |
| GET, POST | `/api/circuit-breaker` | Compare a proposed simulated trade with recorded behaviour |
| GET, POST | `/api/stress-test` | Apply a hypothetical percentage change to open positions |
| GET, POST | `/api/regret-replay` | Compare simulated sell events with the next later sample price |
| GET, POST | `/api/hype-radar` | Identify spikes in simulated social mentions |
| GET, POST | `/api/move-autopsy` | Review price, social-attention and available fundamentals evidence |
| GET, POST | `/api/bull-vs-bear` | Generate opposing interpretations from the same evidence |
| GET, POST | `/api/earnings-language` | Flag vague or cautious wording in a fictional transcript |

## GET examples

```text
GET /api/investor-dna
GET /api/circuit-breaker?symbol=NOVA&action=BUY&quantity=5&price=130
GET /api/stress-test?scenario_change_pct=-10
GET /api/regret-replay
GET /api/hype-radar?spike_multiplier=2
GET /api/move-autopsy?symbol=NOVA
GET /api/bull-vs-bear?symbol=NOVA
GET /api/earnings-language?company=NOVA
```

## POST request examples

Send JSON with the `Content-Type: application/json` header.

### Optional custom investor dataset

Any feature that analyses investor or market data can receive an `investor` object. If omitted, the bundled fictional demo dataset is used.

The expected data structure is:

```json
{
  "investor": {
    "investor_name": "Demo Investor",
    "currency": "INR",
    "trades": [],
    "price_history": {},
    "social_mentions": [],
    "fundamentals": {},
    "earnings_transcripts": []
  }
}
```

Use the same field structure as `data/investor.json`. The arrays and objects should contain the records required by the feature being called.

### Circuit Breaker

```json
{
  "proposed_trade": {
    "symbol": "NOVA",
    "action": "BUY",
    "quantity": 5,
    "price": 130,
    "reason": "Price has been rising quickly"
  }
}
```

### Stress Test

```json
{
  "scenario_change_pct": -10
}
```

Supported scenario range: -100 to +100 percent.

### Hype Radar

```json
{
  "spike_multiplier": 2
}
```

### Move Autopsy and Bull vs Bear

```json
{
  "symbol": "NOVA"
}
```

### Earnings Language Analyser

Choose a bundled transcript by company:

```json
{
  "company": "NOVA"
}
```

Or submit custom transcript text:

```json
{
  "company": "DEMO",
  "quarter": "Q3 FY2026",
  "transcript_text": "We are still evaluating the timing of the project."
}
```

## Notes for frontend integration

- Use GET for the bundled demo examples and POST when submitting user-entered values or a custom fictional dataset.
- Parse the JSON response and render the `result` and `explanation` sections separately.
- Keep the `data_mode: simulated` label visible in the interface.
- All calculations and phrase checks are deterministic Python logic at this stage. Gemini integration is not part of these three feature engines yet.
- Earnings language flags are communication-clarity signals only. They do not detect lies or prove dishonesty.
- These tools are educational demonstrations, not financial advice.
