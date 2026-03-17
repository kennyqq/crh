import { startTransition, useEffect, useState } from 'react'

import './App.css'
import { P0VirtualRouteTest } from './features/p0/P0VirtualRouteTest'
import { P1Insights } from './features/p1/P1Insights'
import { P2Safeguard } from './features/p2/P2Safeguard'
import { P3ComplaintClosure } from './features/p3/P3ComplaintClosure'
import { TopBar } from './features/shared/TopBar'
import { demoScenes, screenDefinitions } from './mock/demoData'
import type { ScreenCode } from './types'

const initialSceneState: Record<ScreenCode, number> = {
  p0: 0,
  p1: 0,
  p2: 0,
  p3: 0,
}

function renderScreen(screen: ScreenCode, sceneId: string, highlightMode: boolean, onJumpToP1: () => void) {
  const scene = demoScenes[screen].find((item) => item.id === sceneId) ?? demoScenes[screen][0]

  switch (screen) {
    case 'p0':
      return <P0VirtualRouteTest key={sceneId} scene={scene} highlightMode={highlightMode} />
    case 'p1':
      return <P1Insights key={sceneId} scene={scene} highlightMode={highlightMode} />
    case 'p2':
      return (
        <P2Safeguard
          key={sceneId}
          scene={scene}
          highlightMode={highlightMode}
          onJumpToP1={onJumpToP1}
        />
      )
    case 'p3':
      return <P3ComplaintClosure key={sceneId} scene={scene} highlightMode={highlightMode} />
    default:
      return null
  }
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenCode>('p0')
  const [sceneIndexByScreen, setSceneIndexByScreen] = useState(initialSceneState)

  const highlightMode = true
  const scenes = demoScenes[currentScreen]
  const currentSceneIndex = sceneIndexByScreen[currentScreen]
  const currentScene = scenes[currentSceneIndex] ?? scenes[0]

  useEffect(() => {
    document.title = '高铁无线智能化运营'
  }, [])

  const handleChangeScreen = (screen: ScreenCode) => {
    startTransition(() => {
      setCurrentScreen(screen)
    })
  }

  const handleJumpToP1 = () => {
    handleChangeScreen('p1')
    setSceneIndexByScreen((current) => ({ ...current, p1: 2 }))
  }

  return (
    <div className="expo-shell">
      <div className="expo-shell__backdrop" />
      <TopBar screens={screenDefinitions} currentScreen={currentScreen} onChangeScreen={handleChangeScreen} />

      <main className="expo-main expo-main--full">
        <section className="expo-stage">
          {renderScreen(currentScreen, currentScene.id, highlightMode, handleJumpToP1)}
        </section>
      </main>
    </div>
  )
}

export default App
