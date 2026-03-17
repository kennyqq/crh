import type { P1TimelineSlice } from '../../types'

interface P1TimelineProps {
  slices: P1TimelineSlice[]
  relatedSliceIds: string[]
  selectedSliceId: string
  onSelectSlice: (sliceId: string) => void
}

export function P1Timeline({ slices, relatedSliceIds, selectedSliceId, onSelectSlice }: P1TimelineProps) {
  const selectedSlice = slices.find((slice) => slice.id === selectedSliceId) ?? slices[0]
  const relatedSet = new Set(relatedSliceIds)

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
          const isRelated = relatedSet.has(slice.id)
          const levelClass = isRelated ? 'related' : 'quiet'

          return (
            <button
              key={slice.id}
              type="button"
              className={`p1-timeline__node p1-timeline__node--${levelClass} ${isSelected ? 'p1-timeline__node--selected' : ''}`.trim()}
              onClick={() => {
                if (isRelated) {
                  onSelectSlice(slice.id)
                }
              }}
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
