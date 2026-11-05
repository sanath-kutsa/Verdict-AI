# Verdict AI

Verdict AI is an educational decision-analysis prototype. Its eight feature workflows combine deterministic calculations with Gemini-generated interpretation of information submitted by the user.

## Run locally

1. Install the Python dependencies:

   ```powershell
   py -m pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` in the repository root.
3. Add your own Gemini API key to `.env` and keep that file private. The default model is `gemini-3.8-flash`; change `GEMINI_MODEL` if needed.
4. Start Flask:

   ```powershell
   py app.py
   ```

5. Open `http://127.0.0.1:5000`, sign in to the local guest workspace, and run a feature from its own input form.

The Gemini API key is read only by the Flask backend and is never sent to the browser. Feature endpoints return an error if Gemini is not configured or the provider request fails; they do not silently substitute a canned AI answer.

## What the eight features do

- **Investor DNA:** combines a self-assessment with patterns calculated from saved paper trades.
- **Circuit Breaker:** checks a proposed trade rationale, emotional state, confidence, and recorded behaviour.
- **Stress Test:** applies a user-entered percentage shock to a symbol, quantity, and reference price.
- **Regret Replay:** compares saved simulated sell transactions with the next available local sample observation.
- **Hype Radar:** analyses a user-pasted narrative and checks any available local sample mention history. It does not scrape social media.
- **Move Autopsy:** analyses user-entered move observations and clearly separates them from bundled sample evidence.
- **Bull vs Bear:** compares the two user-entered theses and highlights assumptions.
- **Earnings Analysis:** reviews a user-pasted earnings transcript excerpt.

## Data and safety boundaries

- Paper trades and the bundled market, social, and company datasets are local simulated data. They are not live exchange feeds.
- User-entered prices and observations are not independently verified.
- Gemini interprets the supplied text and computed result; it does not create verified market data, news, or citations.
- The app is an educational analysis tool, not financial advice or a trading service.
- Guest login is a local prototype identity, not production-grade authentication.
- Gemini requests send the submitted feature inputs and derived analysis to Google's Gemini API. Do not submit private or sensitive information.
- API availability, quotas, and any charges depend on the Google AI Studio project and its current terms.
