from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import json
import os
from openai import OpenAI

app = FastAPI(title="Stock Prediction Auditor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class AnalysisRequest(BaseModel):
    ticker: str
    horizon: str = "1 month"


# ---------------------------------------------------------------------------
# Stock data
# ---------------------------------------------------------------------------

def fetch_stock_data(ticker: str) -> dict:
    stock = yf.Ticker(ticker)
    hist = stock.history(period="6mo")
    if hist.empty:
        raise HTTPException(status_code=404, detail=f"No data found for ticker {ticker}")

    recent = hist.tail(30)
    prices = recent["Close"].round(2).tolist()
    dates = [d.strftime("%Y-%m-%d") for d in recent.index]

    current_price = float(hist["Close"].iloc[-1])
    price_1w_ago  = float(hist["Close"].iloc[-5])  if len(hist) >= 5  else current_price
    price_1m_ago  = float(hist["Close"].iloc[-22]) if len(hist) >= 22 else current_price

    avg_volume    = float(hist["Volume"].tail(20).mean())
    recent_volume = float(hist["Volume"].iloc[-1])
    volume_ratio  = recent_volume / avg_volume if avg_volume > 0 else 1.0

    returns    = hist["Close"].pct_change().dropna()
    volatility = float(returns.tail(20).std() * (252 ** 0.5) * 100)  # annualised %

    info = {}
    try:
        info = stock.info
    except Exception:
        pass

    return {
        "ticker":               ticker.upper(),
        "name":                 info.get("longName", ticker.upper()),
        "sector":               info.get("sector", "Unknown"),
        "current_price":        current_price,
        "currency":             info.get("currency", "USD"),
        "pct_change_1w":        round(((current_price - price_1w_ago) / price_1w_ago) * 100, 2),
        "pct_change_1m":        round(((current_price - price_1m_ago) / price_1m_ago) * 100, 2),
        "volatility_annualised": round(volatility, 2),
        "volume_ratio":         round(volume_ratio, 2),
        "high_52w":             round(float(hist["Close"].max()), 2),
        "low_52w":              round(float(hist["Close"].min()), 2),
        "market_cap":           info.get("marketCap"),
        "pe_ratio":             info.get("trailingPE"),
        "prices":               prices,
        "dates":                dates,
    }


# ---------------------------------------------------------------------------
# Agent runner
# ---------------------------------------------------------------------------

def run_agent(system_prompt: str, user_prompt: str, fallback: dict) -> dict:
    """Call GPT-4o with a system/user prompt pair and parse the JSON response."""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt + "\n\nReturn ONLY valid JSON. Do not include markdown, explanations, or ```json fences."},
            {"role": "user",   "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=600,
    )
    raw = response.choices[0].message.content
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return fallback


# ---------------------------------------------------------------------------
# Agent prompts + callers
# ---------------------------------------------------------------------------

def stock_context(stock: dict) -> str:
    return (
        f"Stock: {stock['name']} ({stock['ticker']})\n"
        f"Current Price: ${stock['current_price']} {stock['currency']}\n"
        f"Sector: {stock['sector']}\n"
        f"1-week change: {stock['pct_change_1w']}%\n"
        f"1-month change: {stock['pct_change_1m']}%\n"
        f"Annualised volatility: {stock['volatility_annualised']}%\n"
        f"Volume vs 20-day avg: {stock['volume_ratio']}x\n"
        f"52-week range: ${stock['low_52w']} – ${stock['high_52w']}\n"
        f"P/E ratio: {stock['pe_ratio']}"
    )


def predictor_agent(stock: dict, horizon: str) -> dict:
    system = """You are a quantitative analyst making a stock price prediction.
Be specific, data-driven, and give a concrete directional call with reasoning.
Respond ONLY with valid JSON, no markdown, no extra text.
JSON format: {
  "direction": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": <integer 0-100>,
  "price_target": <float>,
  "reasoning": "<2-3 sentence explanation>",
  "key_factors": ["factor1", "factor2", "factor3"]
}"""

    user = f"{stock_context(stock)}\nPrediction horizon: {horizon}\n\nMake your prediction."

    return run_agent(system, user, fallback={
        "direction": "NEUTRAL", "confidence": 50,
        "price_target": stock["current_price"],
        "reasoning": "Parse error.", "key_factors": [],
    })


def contrarian_agent(stock: dict, prediction: dict, horizon: str) -> dict:
    system = """You are a contrarian analyst who always argues the OPPOSITE of the given prediction.
Find the strongest possible counter-arguments. Be specific and data-driven.
Respond ONLY with valid JSON, no markdown, no extra text.
JSON format: {
  "verdict": "DISAGREE",
  "severity": <integer 1-10>,
  "counter_direction": "BULLISH" | "BEARISH" | "NEUTRAL",
  "argument": "<2-3 sentence counter-argument>",
  "blind_spots": ["blind spot 1", "blind spot 2"]
}"""

    user = (
        f"Original prediction for {stock['ticker']} over {horizon}:\n"
        f"Direction: {prediction['direction']}, Confidence: {prediction['confidence']}%\n"
        f"Reasoning: {prediction['reasoning']}\n"
        f"Key factors: {', '.join(prediction.get('key_factors', []))}\n\n"
        f"Current price: ${stock['current_price']}\n"
        f"Volatility: {stock['volatility_annualised']}%, 1-month trend: {stock['pct_change_1m']}%\n\n"
        f"Argue the opposite case as strongly as possible."
    )

    return run_agent(system, user, fallback={
        "verdict": "DISAGREE", "severity": 5,
        "counter_direction": "NEUTRAL",
        "argument": "Parse error.", "blind_spots": [],
    })


def risk_agent(stock: dict, prediction: dict, horizon: str) -> dict:
    system = """You are a risk management specialist. Identify tail risks, black swans,
and structural risks that could invalidate any prediction.
Respond ONLY with valid JSON, no markdown, no extra text.
JSON format: {
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "severity": <integer 1-10>,
  "top_risks": [
    {"risk": "name", "probability": "LOW|MEDIUM|HIGH", "impact": "description"}
  ],
  "summary": "<1-2 sentence overall risk assessment>"
}"""

    user = (
        f"Assess risks for this prediction on {stock['name']} ({stock['ticker']}):\n"
        f"Prediction: {prediction['direction']} with {prediction['confidence']}% confidence over {horizon}\n"
        f"Current price: ${stock['current_price']}, Sector: {stock['sector']}\n"
        f"Volatility: {stock['volatility_annualised']}% annualised\n"
        f"52-week range: ${stock['low_52w']} – ${stock['high_52w']}\n\n"
        f"Identify the top 3 risks that could make this prediction wrong."
    )

    return run_agent(system, user, fallback={
        "risk_level": "MEDIUM", "severity": 5,
        "top_risks": [], "summary": "Parse error.",
    })


def sentiment_agent(stock: dict, prediction: dict) -> dict:
    system = """You are a market sentiment analyst. Analyse momentum, mean reversion,
institutional behaviour, and retail sentiment patterns.
Respond ONLY with valid JSON, no markdown, no extra text.
JSON format: {
  "sentiment_score": <integer -100 to 100>,
  "momentum_signal": "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL",
  "severity": <integer 1-10>,
  "analysis": "<2-3 sentence sentiment analysis>",
  "behavioural_flags": ["flag1", "flag2"]
}"""

    user = (
        f"Analyse sentiment for {stock['name']} ({stock['ticker']}):\n"
        f"Current price: ${stock['current_price']}\n"
        f"1W: {stock['pct_change_1w']}%, 1M: {stock['pct_change_1m']}%\n"
        f"Volume vs avg: {stock['volume_ratio']}x, Volatility: {stock['volatility_annualised']}%\n"
        f"52W range: ${stock['low_52w']}–${stock['high_52w']}\n\n"
        f"Base prediction is {prediction['direction']}. Does sentiment support or contradict this?"
    )

    return run_agent(system, user, fallback={
        "sentiment_score": 0, "momentum_signal": "NEUTRAL",
        "severity": 5, "analysis": "Parse error.", "behavioural_flags": [],
    })


def data_agent(stock: dict, prediction: dict) -> dict:
    system = """You are a quantitative data analyst. Examine whether the prediction's
reasoning is actually supported by the available metrics.
Respond ONLY with valid JSON, no markdown, no extra text.
JSON format: {
  "data_support": "STRONG" | "MODERATE" | "WEAK" | "CONTRADICTS",
  "severity": <integer 1-10>,
  "findings": [
    {"metric": "name", "value": "value", "interpretation": "what it means"}
  ],
  "verdict": "<1-2 sentence data-driven verdict>"
}"""

    user = (
        f"Does the data support this prediction for {stock['ticker']}?\n"
        f"Prediction: {prediction['direction']}, confidence {prediction['confidence']}%\n"
        f"Reasoning: {prediction['reasoning']}\n\n"
        f"Data: price ${stock['current_price']}, 1W {stock['pct_change_1w']}%, "
        f"1M {stock['pct_change_1m']}%, vol {stock['volatility_annualised']}%, "
        f"volume ratio {stock['volume_ratio']}x, P/E {stock['pe_ratio']}, "
        f"52W ${stock['low_52w']}–${stock['high_52w']}"
    )

    return run_agent(system, user, fallback={
        "data_support": "MODERATE", "severity": 5,
        "findings": [], "verdict": "Parse error.",
    })


# ---------------------------------------------------------------------------
# Trust score
# ---------------------------------------------------------------------------

def compute_trust_score(prediction: dict, contrarian: dict, risk: dict,
                         sentiment: dict, data_check: dict) -> int:
    score = prediction["confidence"]
    score -= contrarian["severity"] * 2    # contrarian disagreement weighted highest
    score -= risk["severity"] * 1.5        # structural risk second

    sentiment_agrees = (
        sentiment["momentum_signal"] in ["STRONG_BUY", "BUY"]  and prediction["direction"] == "BULLISH" or
        sentiment["momentum_signal"] in ["STRONG_SELL", "SELL"] and prediction["direction"] == "BEARISH"
    )
    score += 5 if sentiment_agrees else -sentiment["severity"]

    if data_check["data_support"] == "STRONG":
        score += 10
    elif data_check["data_support"] == "CONTRADICTS":
        score -= 15

    return max(0, min(100, round(score)))


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/analyse")
async def analyse_stock(request: AnalysisRequest):
    ticker = request.ticker.upper().strip()
    stock  = fetch_stock_data(ticker)

    prediction  = predictor_agent(stock, request.horizon)
    contrarian  = contrarian_agent(stock, prediction, request.horizon)
    risk        = risk_agent(stock, prediction, request.horizon)
    sentiment   = sentiment_agent(stock, prediction)
    data_check  = data_agent(stock, prediction)

    trust_score = compute_trust_score(prediction, contrarian, risk, sentiment, data_check)

    return {
        "stock":      stock,
        "prediction": prediction,
        "audit": {
            "trust_score": trust_score,
            "contrarian":  contrarian,
            "risk":        risk,
            "sentiment":   sentiment,
            "data_check":  data_check,
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
