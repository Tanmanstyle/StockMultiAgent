import './TrustMeter.css'

function getScoreLabel(score) {
  if (score >= 75) return { label: 'HIGH TRUST', color: 'green' }
  if (score >= 50) return { label: 'MODERATE', color: 'amber' }
  if (score >= 25) return { label: 'LOW TRUST', color: 'red' }
  return { label: 'UNRELIABLE', color: 'red' }
}

function CircleGauge({ score }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const gap = circ - filled

  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)'

  return (
    <svg className="gauge-svg" viewBox="0 0 120 120" width="120" height="120">
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="8"
      />
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
      <text x="60" y="55" textAnchor="middle" className="gauge-score" fill="var(--text-primary)">
        {score}
      </text>
      <text x="60" y="72" textAnchor="middle" className="gauge-label" fill="var(--text-muted)">
        TRUST
      </text>
    </svg>
  )
}

export default function TrustMeter({ score, prediction }) {
  const { label, color } = getScoreLabel(score)

  const DIRECTION_CONFIG = {
    BULLISH: { color: 'green', symbol: '▲' },
    BEARISH: { color: 'red', symbol: '▼' },
    NEUTRAL: { color: 'amber', symbol: '◆' },
  }
  const dcfg = DIRECTION_CONFIG[prediction.direction] || DIRECTION_CONFIG.NEUTRAL

  return (
    <div className="trust-meter">
      <div className="trust-header">
        <span className="trust-title">AUDIT SCORE</span>
      </div>

      <div className="gauge-wrap">
        <CircleGauge score={score} />
      </div>

      <div className={`trust-verdict verdict-${color}`}>{label}</div>

      <div className="trust-breakdown">
        <div className="tb-row">
          <span className="tb-label">Direction</span>
          <span className={`tb-val dir-${dcfg.color}`}>{dcfg.symbol} {prediction.direction}</span>
        </div>
        <div className="tb-row">
          <span className="tb-label">Confidence</span>
          <span className="tb-val">{prediction.confidence}%</span>
        </div>
        <div className="tb-row">
          <span className="tb-label">Target</span>
          <span className="tb-val mono">${prediction.price_target?.toFixed(2) ?? '—'}</span>
        </div>
      </div>

      <div className="trust-note">
        Score computed from 4 independent critic agents. Lower scores indicate higher disagreement or risk.
      </div>
    </div>
  )
}
