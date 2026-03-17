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
      color={['#163655', '#4ecfff']}
      backgroundColor="rgba(8, 16, 26, 0.92)"
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
