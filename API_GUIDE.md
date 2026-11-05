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
| GET | `/api/dashboard` | Dashboard summary and bundled demo trades |
| POST | `/api/users/guest` | Create a local simulated demo user |
| GET | `/api/users/<user_id>` | Get a demo user profile |
| GET, POST | `/api/users/<user_id>/trades` | Read or save that user's simulated trades |
| GET | `/api/users/<user_id>/portfolio` | Get simulated cash balance and holdings |
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

## Simulated user accounts and persistence

The backend creates a local SQLite database automatically at `instance/verdict_ai.db`.
No database server or extra Python package is required. The database file is created
when Flask starts and is intentionally excluded from Git.

Create a demo user:

```http
POST /api/users/guest
Content-Type: application/json

{"name":"Demo User"}
```

The response includes a numeric `user.id`. Keep it in the frontend session while
the user is using the demo.

Save a simulated trade:

```http
POST /api/users/1/trades
Content-Type: application/json

{
  "symbol": "NOVA",
  "action": "BUY",
  "quantity": 5,
  "price": 130,
  "reason": "Testing a planned entry"
}
```

Read trades and portfolio:

```text
GET /api/users/1/trades
GET /api/users/1/portfolio
```

Pass the user's ID to feature endpoints so they analyse that user's saved trades:

```text
GET /api/investor-dna?user_id=1
GET /api/regret-replay?user_id=1
```

Each new demo user starts with ₹1,00,000 in simulated cash. The API checks that a
BUY does not exceed available cash and a SELL does not exceed the user's holdings.
Market history, fundamentals, social mentions and earnings examples still come
from the bundled fictional dataset.

**Prototype security note:** These demo-user endpoints do not yet authenticate
the person making the request. They are for a local hackathon prototype only.
Do not expose them as a public multi-user service until Google sign-in or another
server-verified authentication method is connected and every user-specific route
checks the authenticated user on the server.

## Google sign-in setup (next integration step)

The database has a `google_sub` field ready to associate a verified Google account
with a user. The actual Google sign-in flow is not connected yet.

1. Open Google Cloud Console and create/select a project.
2. Configure the OAuth consent screen / Google Auth Platform branding and audience.
3. Create an OAuth client ID of type **Web application**.
4. Add the local JavaScript origin used by the app (for example
   `http://localhost:5000` and/or `http://127.0.0.1:5000`).
5. When the frontend is ready, add Google Identity Services and use the client ID
   in the browser sign-in button.
6. Send the returned ID token to a Flask authentication endpoint. The backend
   must verify the token's signature, issuer, audience and expiry before calling
   the database's Google-user lookup/create function.

The Google client ID is not a password, but a client secret or signing credentials
must never be placed in frontend JavaScript. Do not trust an email or user ID sent
by the browser as proof of identity. Google sign-in should be completed before
making these user-specific endpoints publicly accessible.