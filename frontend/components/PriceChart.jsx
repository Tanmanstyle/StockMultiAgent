import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import './PriceChart.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="tt-date">{label}</div>
      <div className="tt-price">${payload[0].value.toFixed(2)}</div>
    </div>
  )
}

export default function PriceChart({ stock }) {
  const data = stock.dates.map((date, i) => ({
    date: date.slice(5), // MM-DD
    price: stock.prices[i],
  }))

  const min = Math.min(...stock.prices)
  const max = Math.max(...stock.prices)
  const padding = (max - min) * 0.1
  const isUp = stock.prices[stock.prices.length - 1] >= stock.prices[0]

  // Show every ~5th label
  const tickDates = data.filter((_, i) => i % 5 === 0).map(d => d.date)

  return (
    <div className="price-chart-card">
      <div className="chart-header">
        <span className="chart-title">30-Day Price</span>
        <span className={`chart-badge ${isUp ? 'up' : 'down'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(stock.pct_change_1m)}% past month
        </span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              ticks={tickDates}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Space Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[min - padding, max + padding]}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Space Mono' }}
              axisLine={false}
              tickLine={false}
              width={55}
              tickFormatter={v => `$${v.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={stock.prices[0]} stroke="var(--border-bright)" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isUp ? 'var(--green)' : 'var(--red)'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: isUp ? 'var(--green)' : 'var(--red)', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
