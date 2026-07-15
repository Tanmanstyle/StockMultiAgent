import './StockHeader.css'

function fmt(n, digits = 2) {
  if (n == null) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return n.toFixed(digits)
}

export default function StockHeader({ stock }) {
  const up = stock.pct_change_1m >= 0
  const up1w = stock.pct_change_1w >= 0

  return (
    <div className="stock-header">
      <div className="stock-identity">
        <div className="stock-ticker">{stock.ticker}</div>
        <div className="stock-name">{stock.name}</div>
        {stock.sector !== 'Unknown' && <div className="stock-sector">{stock.sector}</div>}
      </div>

      <div className="stock-price-block">
        <div className="stock-price">
          <span className="price-currency">{stock.currency === 'USD' ? '$' : stock.currency}</span>
          <span className="price-value">{stock.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className={`price-change ${up ? 'up' : 'down'}`}>
          {up ? '▲' : '▼'} {Math.abs(stock.pct_change_1m).toFixed(2)}% (1M)
        </div>
      </div>

      <div className="stock-metrics">
        <div className="metric">
          <span className="metric-label">1W</span>
          <span className={`metric-value ${up1w ? 'up' : 'down'}`}>
            {up1w ? '+' : ''}{stock.pct_change_1w}%
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Volatility</span>
          <span className="metric-value">{stock.volatility_annualised}%</span>
        </div>
        <div className="metric">
          <span className="metric-label">Vol Ratio</span>
          <span className={`metric-value ${stock.volume_ratio > 1.5 ? 'amber' : ''}`}>
            {stock.volume_ratio}x
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">52W Range</span>
          <span className="metric-value mono">${stock.low_52w} – ${stock.high_52w}</span>
        </div>
        {stock.market_cap && (
          <div className="metric">
            <span className="metric-label">Mkt Cap</span>
            <span className="metric-value">{fmt(stock.market_cap)}</span>
          </div>
        )}
        {stock.pe_ratio && (
          <div className="metric">
            <span className="metric-label">P/E</span>
            <span className="metric-value">{typeof stock.pe_ratio === 'number' ? stock.pe_ratio.toFixed(1) : stock.pe_ratio}</span>
          </div>
        )}
      </div>
    </div>
  )
}
