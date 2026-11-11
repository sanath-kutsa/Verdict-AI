# Verdict AI
### Decide Before You Trade.

Verdict AI is an AI-powered investor decision-support platform designed to help users examine market scenarios, understand potential risks, evaluate investment decisions, and recognise behavioural biases before making a trade.

Built as an educational hackathon project, Verdict AI combines rule-based financial analysis with Gemini-powered explanations to make complex investment concepts easier to understand.

**Built by Team Prompt Pirates**

---

## Overview

Investment decisions are often influenced by market hype, emotional reactions, incomplete information, and overconfidence.

Verdict AI aims to address this problem by providing a collection of interactive analysis tools that help users look beyond market noise and examine different aspects of an investment decision.

Instead of simply presenting a Buy or Sell signal, the platform focuses on explaining possible outcomes, identifying risks, and encouraging more informed decision-making.

## Features

Verdict AI includes eight core analysis workflows:

### 1. Investor DNA
Evaluates investor responses to identify behavioural tendencies, risk preferences, and potential decision-making biases.

### 2. Circuit Breaker
Helps users recognise risky investment patterns and situations where taking a step back may be beneficial.

### 3. Stress Test
Evaluates how a portfolio or investment scenario may behave under different hypothetical market conditions.

### 4. Regret Replay
Allows users to revisit hypothetical investment decisions and examine how alternative choices could have affected the outcome.

### 5. Hype Radar
Examines market sentiment and hype-related signals to encourage users to distinguish market excitement from meaningful information.

### 6. Move Autopsy
Breaks down an investment decision or market movement to examine contributing factors, possible risks, and lessons.

### 7. Bull vs Bear
Presents opposing bullish and bearish perspectives to help users consider both the opportunities and risks associated with an investment.

### 8. Earnings Analysis
Examines earnings-call commentary and identifies potentially vague or cautious language patterns. It helps users evaluate communication clarity without claiming to detect dishonesty.

---

## AI Integration

Verdict AI integrates the **Google Gemini API** to generate contextual explanations and additional insights for supported analysis workflows.

The application also includes deterministic, rule-based analysis as a fallback when AI services are unavailable.

This hybrid approach allows the application to retain core functionality even when a Gemini request fails.

### Analysis modes

- **Gemini-powered analysis:** Generates contextual explanations using the Gemini API.
- **Rule-based analysis:** Uses predefined logic and calculations to produce results without relying on an external AI request.

---

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Python, Flask |
| Frontend | HTML5, CSS3, JavaScript |
| AI Integration | Google Gemini API |
| Database | SQLite |
| Communication | REST API, JSON |
| Deployment | Render |
| Production Server | Gunicorn |
| Version Control | Git and GitHub |

The frontend uses vanilla JavaScript without a React-based framework.

---

## Project Architecture

```text
Verdict-AI/
│
├── app.py
├── requirements.txt
├── API_GUIDE.md
├── .env.example
│
├── data/
│   └── Sample and demonstration data
│
├── services/
│   ├── AI analysis
│   ├── Investor analysis
│   ├── Stress testing
│   └── Other feature logic
│
├── templates/
│   └── HTML pages
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
└── instance/
    └── SQLite database
```

*The directory listing is a simplified overview of the project.*

---

## Getting Started

Follow these steps to run Verdict AI locally.

### Prerequisites

- Python 3.10 or later
- Git
- A Google Gemini API key for AI-powered analysis

### 1. Clone the repository

```bash
git clone https://github.com/sanath-kutsa/Verdict-AI.git
```

### 2. Navigate into the project

```bash
cd Verdict-AI
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root and add:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Keep your API key private. Never commit your `.env` file to GitHub.

The application can use its rule-based analysis fallback when Gemini is unavailable.

### 5. Run the application

```bash
python app.py
```

### 6. Open the application

Visit:

```text
http://127.0.0.1:5000
```

---

## Deployment

Verdict AI is deployed using Render.

**Live Application:** https://verdict-ai-95f4.onrender.com

The production application uses Gunicorn to serve the Flask backend.

### Render Configuration

**Build Command**
```bash
pip install -r requirements.txt
```

**Start Command**
```bash
gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120
```

Configure `GEMINI_API_KEY` as an environment variable in the Render dashboard. Do not store API credentials in the repository.

---

## API

Verdict AI uses Flask REST endpoints to connect the frontend with backend analysis services.

The endpoints accept JSON requests and return structured JSON responses.

For endpoint details, request formats, and integration information, refer to:

[`API_GUIDE.md`](./API_GUIDE.md)

The backend also provides a health-check endpoint:

```text
GET /api/health
```

---

## Important Disclaimer

Verdict AI is an educational investor decision-support project.

- It does not provide personalised financial advice.
- It does not guarantee investment returns.
- Market scenarios and bundled demonstration datasets may be simulated.
- Analysis results should not be treated as verified real-time market information.
- AI-generated explanations may contain errors and should be independently evaluated.
- Earnings language analysis identifies wording patterns, not lies or financial misconduct.

Always conduct independent research before making financial decisions.

---

## Future Improvements

Potential areas for further development include:

- Integration with reliable live market-data providers.
- More advanced portfolio risk modelling.
- Expanded behavioural analysis.
- Improved historical market scenario testing.
- More comprehensive earnings-call analysis.
- Enhanced AI-generated explanations.
- Additional visualisations and analytical reports.

---

## Team

**Team Name:** Prompt Pirates

**Project:** Verdict AI

**Tagline:** Decide Before You Trade.

---

## Acknowledgements

- Google Gemini API for AI-powered analysis.
- Flask for backend development.
- Render for application deployment.
- The open-source developer community.

---

*Verdict AI is built to encourage better questions, clearer thinking, and more informed investment decisions.*
