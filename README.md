# Verdict AI

Verdict AI is an educational decision-analysis MVP. Its eight feature workflows use local rule-based analysis and deterministic calculations. No external AI API key or internet connection is required for the feature workflows.

## Run locally

1. Install the Python dependencies:

   ```powershell
   py -m pip install -r requirements.txt
   ```

2. Start Flask:

   ```powershell
   py app.py
   ```

3. Open `http://127.0.0.1:5000` and run any feature from its own input form. Guest login is optional for standalone feature analysis; it enables saved paper-trade history.

Each feature page contains its own input form and renders its result in the page after submission. Results are local rule-based calculations, not generative-AI responses.

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
- Analysis uses transparent local rules and arithmetic. It does not create verified market data, news, or citations.
- The app is an educational analysis tool, not financial advice or a trading service.
- Guest login is a local prototype identity, not production-grade authentication.
