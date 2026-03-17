import { BorderBox8, DigitalFlop } from '@jiaminghi/data-view-react'

interface MetricCardProps {
  label: string
  value: string
  tone?: 'default' | 'accent' | 'warning' | 'critical'
  note?: string
}

function parseMetricValue(value: string) {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(.*)$/)

  if (!match) {
    return null
  }

  const decimals = match[1].includes('.') ? match[1].split('.')[1].length : 0

  return {
    number: Number(match[1]),
    suffix: match[2].trim(),
    decimals,
  }
}

export function MetricCard({
  label,
  value,
  tone = 'default',
  note,
}: MetricCardProps) {
  const numericValue = parseMetricValue(value)
  const resolvedNote = note?.trim()

  return (
    <BorderBox8 className={`metric-card-shell metric-card-shell--${tone}`} color={['#183857', '#4ecfff']}>
      <article className={`metric-card metric-card--${tone}`}>
        <p className="metric-card__label">{label}</p>
        {numericValue ? (
          <DigitalFlop
            className="metric-card__flop"
            config={{
              number: [numericValue.number],
              content: numericValue.suffix ? `{nt} ${numericValue.suffix}` : '{nt}',
              toFixed: numericValue.decimals,
              style: {
                fontSize: 22,
                fill:
                  tone === 'critical'
                    ? '#ff6247'
                    : tone === 'warning'
                      ? '#ffca58'
                      : tone === 'accent'
                        ? '#53d7ff'
                        : '#eff7ff',
                fontWeight: 700,
              },
            }}
          />
        ) : (
          <strong className="metric-card__value">{value}</strong>
        )}
        {resolvedNote ? <p className="metric-card__note">{resolvedNote}</p> : null}
      </article>
    </BorderBox8>
  )
}
