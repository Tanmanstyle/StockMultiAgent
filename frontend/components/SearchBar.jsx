import { useState } from 'react'
import './SearchBar.css'

const HORIZONS = ['1 week', '1 month', '3 months']

export default function SearchBar({ onAnalyse, loading }) {
  const [ticker, setTicker] = useState('')
  const [horizon, setHorizon] = useState('1 month')

  const handleSubmit = () => {
    const t = ticker.trim().toUpperCase()
    if (!t) return
    onAnalyse(t, horizon)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-prefix">$</span>
        <input
          className="search-input"
          type="text"
          placeholder="TICKER"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={handleKey}
          maxLength={10}
          spellCheck={false}
          disabled={loading}
        />
      </div>

      <div className="horizon-group">
        {HORIZONS.map(h => (
          <button
            key={h}
            className={`horizon-btn ${horizon === h ? 'active' : ''}`}
            onClick={() => setHorizon(h)}
            disabled={loading}
          >
            {h}
          </button>
        ))}
      </div>

      <button
        className="analyse-btn"
        onClick={handleSubmit}
        disabled={loading || !ticker.trim()}
      >
        {loading ? <span className="spinner" /> : 'Run Audit'}
      </button>
    </div>
  )
}
