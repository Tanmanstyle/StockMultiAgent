# Stock Prediction Auditor

A multi-agent AI system that generates a stock prediction and runs 4 independent critic agents to audit it. Built with FastAPI, React, and OpenAI GPT-4o.

## Architecture

```
User inputs ticker
      │
      ▼
  FastAPI Backend
      │
      ├── yfinance: fetch real market data
      │
      ├── Predictor Agent   → makes a directional call + reasoning
      ├── Contrarian Agent  → argues the opposite case
      ├── Risk Agent        → identifies tail risks & black swans
      ├── Sentiment Agent   → analyses momentum & behavioural signals
      └── Data Agent        → checks if reasoning matches actual data
                │
                ▼
        Trust Score (0-100)
        Audit breakdown UI
```

## Setup

### 1. Clone & configure

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your OpenAI API key
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Tech Stack

- **Backend**: FastAPI, yfinance, OpenAI GPT-4o
- **Frontend**: React, Recharts, Vite
- **Design**: Space Grotesk + Space Mono, dark terminal aesthetic

## How the Trust Score Works

The trust score starts from the predictor's confidence and is adjusted by each critic agent's severity rating. High contrarian disagreement, high risk severity, or data contradictions pull the score down. Sentiment alignment pushes it up.

It's not a trading signal — it's a measure of how well the prediction holds up under adversarial scrutiny.

## Talking Points for Interviews

- **Multi-agent architecture**: each agent has a distinct role, persona, and structured output schema
- **Prompt engineering**: agents receive the same data but with different system prompts to elicit different reasoning modes
- **Adversarial design**: the system is explicitly designed to stress-test its own outputs
- **Real data pipeline**: yfinance integration for live market metrics
- **Scoring algorithm**: trust score as a weighted combination of agent severities
