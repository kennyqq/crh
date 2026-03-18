import type { ReactNode } from 'react'

import { BorderBox12 } from '@jiaminghi/data-view-react'

interface DataPanelProps {
  title?: string
  subtitle?: string
  aside?: ReactNode
  className?: string
  children: ReactNode
}

export function DataPanel({
  title,
  subtitle,
  aside,
  className = '',
  children,
}: DataPanelProps) {
  const heading = subtitle ?? title
  const eyebrow = subtitle ? title : undefined

  return (
    <BorderBox12
      className={`dv-panel-frame ${className}`.trim()}
      color={['#13293d', '#2e546c']}
      backgroundColor="rgba(8, 15, 24, 0.94)"
    >
      <section className="dv-panel">
        {heading || aside ? (
          <header className="dv-panel__header">
            <div className="dv-panel__titlegroup">
              {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
              {heading ? <h3>{heading}</h3> : null}
            </div>
            {aside ? <div className="dv-panel__aside">{aside}</div> : null}
          </header>
        ) : null}
        <div className="dv-panel__body">{children}</div>
      </section>
    </BorderBox12>
  )
}
