import type { P1TimelineSlice } from '../../types'

interface P1TimelineProps {
  slices: P1TimelineSlice[]
  selectedSliceId: string
  onSelectSlice: (sliceId: string) => void
}

export function P1Timeline({ slices, selectedSliceId, onSelectSlice }: P1TimelineProps) {
  const selectedSlice = slices.find((slice) => slice.id === selectedSliceId) ?? slices[0]

  return (
    <section className="p1-timeline">
      <header className="p1-timeline__header">
        <div>
          <span>时间切片</span>
          <strong>08:00 - 09:55 / 五分钟一帧</strong>
        </div>
        <div className="p1-timeline__current">
          <span>当前时点</span>
          <strong>{selectedSlice.timeLabel}</strong>
        </div>
      </header>

      <div className="p1-timeline__track">
        {slices.map((slice) => {
          const isSelected = slice.id === selectedSliceId
          const levelClass =
            slice.activeIssueTypes.length >= 3
              ? 'critical'
              : slice.activeIssueTypes.length === 2
                ? 'warning'
                : slice.activeIssueTypes.length === 1
                  ? 'notice'
                  : 'quiet'

          return (
            <button
              key={slice.id}
              type="button"
              className={`p1-timeline__node p1-timeline__node--${levelClass} ${isSelected ? 'p1-timeline__node--selected' : ''}`.trim()}
              onClick={() => onSelectSlice(slice.id)}
            >
              <span className="p1-timeline__dot" />
              <span className="p1-timeline__time">{slice.timeLabel}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
