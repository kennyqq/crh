import { useEffect, useState } from 'react'

import { BorderBox13 } from '@jiaminghi/data-view-react'
import type { ScreenCode, ScreenDefinition } from '../../types'

interface TopBarProps {
  screens: ScreenDefinition[]
  currentScreen: ScreenCode
  onChangeScreen: (screen: ScreenCode) => void
}

const screenLabels: Record<ScreenCode, { title: string; order: string }> = {
  p0: { title: '线路态势', order: '01' },
  p1: { title: '感知洞察', order: '02' },
  p2: { title: '策略保障', order: '03' },
}

export function TopBar({ screens, currentScreen, onChangeScreen }: TopBarProps) {
  const [clock, setClock] = useState('')

  useEffect(() => {
    const updateClock = () => {
      setClock(
        new Intl.DateTimeFormat('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour12: false,
        }).format(new Date()),
      )
    }

    updateClock()
    const timer = window.setInterval(updateClock, 60000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <BorderBox13 className="topbar-shell" color={['#1b3a54', '#3c6279']}>
      <header className="topbar topbar--compact">
        <div className="topbar__brand">
          <div className="topbar__title">
            <h1>高铁无线智能化运营</h1>
          </div>
        </div>

        <nav className="screen-tabs screen-tabs--flow" aria-label="系统模块">
          <div className="screen-tabs__rail" aria-hidden="true" />
          {screens.map((screen, index) => {
            const label = screenLabels[screen.code]
            return (
              <div key={screen.code} className="screen-tabs__item">
                <button
                  type="button"
                  className={`screen-tab screen-tab--compact ${screen.code === currentScreen ? 'screen-tab--active' : ''}`}
                  onClick={() => onChangeScreen(screen.code)}
                >
                  <span>{label.order}</span>
                  <strong>{label.title}</strong>
                </button>
                {index < screens.length - 1 ? <i className="screen-tabs__arrow" aria-hidden="true" /> : null}
              </div>
            )
          })}
        </nav>

        <div className="topbar__meta topbar__meta--single">
          <div className="meta-pill">
            <span>更新时间</span>
            <strong>{clock}</strong>
          </div>
        </div>
      </header>
    </BorderBox13>
  )
}
