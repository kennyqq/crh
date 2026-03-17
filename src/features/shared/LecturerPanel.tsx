import type { DemoScene, ScreenCode } from '../../types'

interface LecturerPanelProps {
  currentScreen: ScreenCode
  currentScene: DemoScene
  scenes: DemoScene[]
  sceneIndex: number
  highlightMode: boolean
  autoPlay: boolean
  onSelectScene: (index: number) => void
  onNextScene: () => void
  onPreviousScene: () => void
  onReset: () => void
  onToggleHighlight: () => void
  onToggleAutoPlay: () => void
}

export function LecturerPanel({
  currentScreen,
  currentScene,
  scenes,
  sceneIndex,
  highlightMode,
  autoPlay,
  onSelectScene,
  onNextScene,
  onPreviousScene,
  onReset,
  onToggleHighlight,
  onToggleAutoPlay,
}: LecturerPanelProps) {
  return (
    <aside className="lecturer-panel">
      <div className="lecturer-panel__hero panel">
        <p className="eyebrow">讲解员控制台</p>
        <h2>{currentScene.kicker}</h2>
        <p className="panel__summary">{currentScene.summary}</p>
        <div className="control-grid">
          <button type="button" className="action-button" onClick={onPreviousScene}>
            上一步
          </button>
          <button type="button" className="action-button action-button--accent" onClick={onNextScene}>
            下一步
          </button>
          <button type="button" className="action-button" onClick={onReset}>
            重置本页
          </button>
          <button type="button" className="action-button" onClick={onToggleHighlight}>
            {highlightMode ? '关闭高亮' : '打开高亮'}
          </button>
          <button type="button" className="action-button action-button--wide" onClick={onToggleAutoPlay}>
            {autoPlay ? '停止轻轮播' : '开启轻轮播'}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel__header panel__header--tight">
          <div>
            <p className="eyebrow">讲解剧本</p>
            <h3>{currentScreen.toUpperCase()} 分镜</h3>
          </div>
          <span className="badge">
            {sceneIndex + 1} / {scenes.length}
          </span>
        </div>
        <div className="scene-list">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              type="button"
              className={`scene-item ${index === sceneIndex ? 'scene-item--active' : ''}`}
              onClick={() => onSelectScene(index)}
            >
              <span>{scene.kicker}</span>
              <strong>{scene.title}</strong>
              <small>{scene.summary}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">当前话术提示</p>
        <ul className="callout-list">
          {currentScene.callouts.map((callout) => (
            <li key={callout}>{callout}</li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
