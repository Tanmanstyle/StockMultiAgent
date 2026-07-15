import './PredictionCard.css'

const DIRECTION_CONFIG = {
  BULLISH: { color: 'green', symbol: '▲', label: 'BULLISH' },
  BEARISH: { color: 'red', symbol: '▼', label: 'BEARISH' },
  NEUTRAL: { color: 'amber', symbol: '◆', label: 'NEUTRAL' },
}

export default function PredictionCard({ prediction }) {
  const cfg = DIRECTION_CONFIG[prediction.direction] || DIRECTION_CONFIG.NEUTRAL

  return (
    <div className={`prediction-card border-${cfg.color}`}>
      <div className="prediction-header">
        <div className="pred-label">PREDICTOR AGENT</div>
        <div className={`pred-direction ${cfg.color}`}>
          <span className="pred-symbol">{cfg.symbol}</span>
          <span className="pred-dir-text">{cfg.label}</span>
        </div>
      </div>

      <div className="prediction-body">
        <div className="pred-meta">
          <div className="pred-stat">
            <span className="pred-stat-label">Confidence</span>
            <span className="pred-stat-value">{prediction.confidence}%</span>
            <div className="confidence-bar-track">
              <div
                className={`confidence-bar-fill fill-${cfg.color}`}
                style={{ width: `${prediction.confidence}%` }}
              />
            </div>
          </div>
          <div className="pred-stat">
            <span className="pred-stat-label">Price Target</span>
            <span className="pred-stat-value mono">${prediction.price_target?.toFixed(2) ?? '—'}</span>
          </div>
        </div>

        <p className="pred-reasoning">{prediction.reasoning}</p>

        {prediction.key_factors?.length > 0 && (
          <div className="pred-factors">
            {prediction.key_factors.map((f, i) => (
              <span key={i} className="factor-tag">{f}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
