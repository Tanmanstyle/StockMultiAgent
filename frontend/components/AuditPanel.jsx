import { useState } from 'react'
import './AuditPanel.css'

function SeverityBar({ value, max = 10, color = 'amber' }) {
  const pct = (value / max) * 100
  return (
    <div className="sev-track">
      <div className={`sev-fill fill-${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function AgentCard({ id, title, icon, children, severity, severityColor }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="agent-card">
      <button className="agent-header" onClick={() => setOpen(o => !o)}>
        <div className="agent-title-row">
          <span className="agent-icon">{icon}</span>
          <span className="agent-title">{title}</span>
        </div>
        <div className="agent-header-right">
          {severity != null && (
            <div className="sev-inline">
              <SeverityBar value={severity} color={severityColor} />
              <span className="sev-num">{severity}/10</span>
            </div>
          )}
          <span className="agent-chevron">{open ? '−' : '+'}</span>
        </div>
      </button>
      {open && <div className="agent-body">{children}</div>}
    </div>
  )
}

function RiskBadge({ level }) {
  const colors = { LOW: 'green', MEDIUM: 'amber', HIGH: 'red', CRITICAL: 'red' }
  const c = colors[level] || 'amber'
  return <span className={`risk-badge badge-${c}`}>{level}</span>
}

function ProbBadge({ prob }) {
  const colors = { LOW: 'green', MEDIUM: 'amber', HIGH: 'red' }
  const c = colors[prob] || 'amber'
  return <span className={`prob-badge badge-${c}`}>{prob}</span>
}

function SupportBadge({ support }) {
  const colors = { STRONG: 'green', MODERATE: 'amber', WEAK: 'red', CONTRADICTS: 'red' }
  const c = colors[support] || 'amber'
  return <span className={`risk-badge badge-${c}`}>{support}</span>
}

export default function AuditPanel({ audit }) {
  const { contrarian, risk, sentiment, data_check } = audit

  const sentimentDir = sentiment.sentiment_score > 15 ? 'BULLISH' :
                       sentiment.sentiment_score < -15 ? 'BEARISH' : 'NEUTRAL'
  const sentimentColor = sentimentDir === 'BULLISH' ? 'green' : sentimentDir === 'BEARISH' ? 'red' : 'amber'

  return (
    <div className="audit-panel">
      <div className="audit-panel-header">
        <span className="panel-title">CRITIC AGENTS</span>
        <span className="panel-sub">4 independent audits</span>
      </div>

      <div className="agents-list">
        {/* Contrarian */}
        <AgentCard
          id="contrarian"
          title="Contrarian"
          icon="⟳"
          severity={contrarian.severity}
          severityColor="red"
        >
          <div className="agent-content">
            <div className="agent-row">
              <span className="agent-field">Counter-call</span>
              <span className={`agent-val dir-${contrarian.counter_direction?.toLowerCase()}`}>
                {contrarian.counter_direction}
              </span>
            </div>
            <p className="agent-text">{contrarian.argument}</p>
            {contrarian.blind_spots?.length > 0 && (
              <div className="blind-spots">
                <span className="blind-label">Blind spots identified:</span>
                <ul className="blind-list">
                  {contrarian.blind_spots.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AgentCard>

        {/* Risk */}
        <AgentCard
          id="risk"
          title="Risk"
          icon="⚠"
          severity={risk.severity}
          severityColor="red"
        >
          <div className="agent-content">
            <div className="agent-row">
              <span className="agent-field">Risk Level</span>
              <RiskBadge level={risk.risk_level} />
            </div>
            <p className="agent-text">{risk.summary}</p>
            {risk.top_risks?.length > 0 && (
              <div className="risk-list">
                {risk.top_risks.map((r, i) => (
                  <div key={i} className="risk-item">
                    <div className="risk-item-header">
                      <span className="risk-name">{r.risk}</span>
                      <ProbBadge prob={r.probability} />
                    </div>
                    <p className="risk-impact">{r.impact}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AgentCard>

        {/* Sentiment */}
        <AgentCard
          id="sentiment"
          title="Sentiment"
          icon="◎"
          severity={sentiment.severity}
          severityColor={sentimentColor}
        >
          <div className="agent-content">
            <div className="agent-row">
              <span className="agent-field">Momentum Signal</span>
              <span className={`agent-val dir-${sentimentDir.toLowerCase()}`}>
                {sentiment.momentum_signal}
              </span>
            </div>
            <div className="sentiment-score-row">
              <span className="agent-field">Sentiment Score</span>
              <div className="sentiment-bar-wrap">
                <div className="sentiment-track">
                  <div
                    className={`sentiment-fill fill-${sentimentColor}`}
                    style={{
                      left: sentiment.sentiment_score >= 0 ? '50%' : `${50 + sentiment.sentiment_score / 2}%`,
                      width: `${Math.abs(sentiment.sentiment_score) / 2}%`
                    }}
                  />
                  <div className="sentiment-center-line" />
                </div>
                <span className={`sentiment-score-val col-${sentimentColor}`}>
                  {sentiment.sentiment_score > 0 ? '+' : ''}{sentiment.sentiment_score}
                </span>
              </div>
            </div>
            <p className="agent-text">{sentiment.analysis}</p>
            {sentiment.behavioural_flags?.length > 0 && (
              <div className="pred-factors" style={{ marginTop: 8 }}>
                {sentiment.behavioural_flags.map((f, i) => (
                  <span key={i} className="factor-tag">{f}</span>
                ))}
              </div>
            )}
          </div>
        </AgentCard>

        {/* Data Check */}
        <AgentCard
          id="data"
          title="Data Integrity"
          icon="⊞"
          severity={data_check.severity}
          severityColor={data_check.data_support === 'STRONG' ? 'green' : data_check.data_support === 'CONTRADICTS' ? 'red' : 'amber'}
        >
          <div className="agent-content">
            <div className="agent-row">
              <span className="agent-field">Data Support</span>
              <SupportBadge support={data_check.data_support} />
            </div>
            <p className="agent-text">{data_check.verdict}</p>
            {data_check.findings?.length > 0 && (
              <div className="findings-table">
                {data_check.findings.map((f, i) => (
                  <div key={i} className="finding-row">
                    <span className="finding-metric">{f.metric}</span>
                    <span className="finding-value mono">{f.value}</span>
                    <span className="finding-interp">{f.interpretation}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AgentCard>
      </div>
    </div>
  )
}
