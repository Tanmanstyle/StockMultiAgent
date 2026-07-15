import { useState } from 'react'
import SearchBar from './components/SearchBar.jsx'
import StockHeader from './components/StockHeader.jsx'
import PredictionCard from './components/PredictionCard.jsx'
import AuditPanel from './components/AuditPanel.jsx'
import PriceChart from './components/PriceChart.jsx'
import TrustMeter from './components/TrustMeter.jsx'
import './App.css'

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyse = async (ticker, horizon) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, horizon }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Analysis failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-bracket">[</span>
            <span className="logo-text">AUDITOR</span>
            <span className="logo-bracket">]</span>
          </div>
          <p className="tagline">Multi-agent stock prediction audit system</p>
        </div>
      </header>

      <main className="app-main">
        <SearchBar onAnalyse={handleAnalyse} loading={loading} />

        {error && (
          <div className="error-banner fade-in">
            <span className="error-dot" />
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-state fade-in">
            <div className="loading-inner">
              <div className="spinner" />
              <div className="loading-text">
                <p className="loading-title">Running agent audit...</p>
                <p className="loading-sub">Predictor → Contrarian → Risk → Sentiment → Data</p>
              </div>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="results fade-in">
            <StockHeader stock={result.stock} />

            <div className="results-grid">
              <div className="col-main">
                <PriceChart stock={result.stock} />
                <PredictionCard prediction={result.prediction} horizon={result.stock} />
                <AuditPanel audit={result.audit} />
              </div>
              <div className="col-side">
                <TrustMeter score={result.audit.trust_score} prediction={result.prediction} />
              </div>
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="empty-state">
            <div className="empty-grid">
              {['AAPL', 'TSLA', 'NVDA', 'MSFT'].map(t => (
                <button key={t} className="example-ticker" onClick={() => handleAnalyse(t, '1 month')}>
                  {t}
                </button>
              ))}
            </div>
            <p className="empty-hint">Enter any ticker or try an example above</p>
          </div>
        )}
      </main>
    </div>
  )
}
