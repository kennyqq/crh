import { DataPanel } from './DataPanel'

interface LineSeries {
  id: string
  name: string
  color: string
  values: number[]
}

interface LineChartProps {
  title: string
  subtitle: string
  series: LineSeries[]
  activeIndex?: number
  formatter?: (value: number) => string
}

function buildPolyline(values: number[], min: number, max: number, width: number, height: number) {
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width
      const ratio = (value - min) / Math.max(max - min, 1)
      const y = height - ratio * height
      return `${x},${y}`
    })
    .join(' ')
}

export function LineChart({
  title,
  subtitle,
  series,
  activeIndex,
  formatter = (value) => value.toFixed(0),
}: LineChartProps) {
  const width = 620
  const height = 220
  const values = series.flatMap((item) => item.values)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const length = series[0]?.values.length ?? 1
  const markerX =
    activeIndex === undefined ? undefined : (activeIndex / Math.max(length - 1, 1)) * width

  return (
    <DataPanel
      className="chart-panel"
      title={title}
      subtitle={subtitle}
      aside={
        <div className="chart-legend">
          {series.map((item) => (
            <span key={item.id} className="chart-legend__item">
              <i style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
          ))}
        </div>
      }
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={subtitle}>
        <defs>
          {series.map((item) => (
            <linearGradient key={item.id} id={`gradient-${item.id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={item.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        <g className="chart-grid">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = ratio * height
            const value = max - (max - min) * ratio
            return (
              <g key={ratio}>
                <line x1="0" x2={width} y1={y} y2={y} />
                <text x="8" y={Math.max(14, y - 6)}>
                  {formatter(value)}
                </text>
              </g>
            )
          })}
        </g>
        {series.map((item) => {
          const polyline = buildPolyline(item.values, min, max, width, height)
          const area = `${polyline} ${width},${height} 0,${height}`
          return (
            <g key={item.id}>
              <polygon points={area} fill={`url(#gradient-${item.id})`} />
              <polyline points={polyline} stroke={item.color} strokeWidth="4" fill="none" />
            </g>
          )
        })}
        {markerX !== undefined ? (
          <line className="chart-marker" x1={markerX} x2={markerX} y1="0" y2={height} />
        ) : null}
      </svg>
    </DataPanel>
  )
}
