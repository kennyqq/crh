import { useEffect, useState } from 'react'

import { lineRiskSegments, safeguardScenarios } from '../../mock/demoData'
import type { DemoScene } from '../../types'
import { DataPanel } from '../shared/DataPanel'
import { MetricCard } from '../shared/MetricCard'

interface P2SafeguardProps {
  scene: DemoScene
  highlightMode: boolean
  onJumpToP1: () => void
}

export function P2Safeguard({ scene, highlightMode, onJumpToP1 }: P2SafeguardProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(safeguardScenarios[0].id)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    if (highlightMode && scene.focusScenarioId) {
      setSelectedScenarioId(scene.focusScenarioId)
      setApplied(scene.focusScenarioId !== 'safeguard-douyin')
    }
  }, [highlightMode, scene])

  const selectedScenario =
    safeguardScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? safeguardScenarios[0]
  const linkedSegment =
    lineRiskSegments.find((segment) => segment.id === selectedScenario.linkedSegmentId) ?? lineRiskSegments[0]

  return (
    <div className="screen-page">
      <section className="screen-hero screen-hero--compact">
        <p className="eyebrow">策略保障</p>
        <h2>分层分级业务保障</h2>
        <p className="screen-hero__summary">
          面向重点用户和关键业务配置差异化保障策略，展示 5QI、RFSP 和调度优先级调整后的体验收益。
        </p>
      </section>

      <DataPanel
        title="业务场景"
        subtitle="保障模板"
        aside={
          <button type="button" className="action-button action-button--accent" onClick={() => setApplied(true)}>
            应用保障策略
          </button>
        }
      >
        <div className="scenario-grid">
          {safeguardScenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className={`scenario-card ${scenario.id === selectedScenario.id ? 'scenario-card--active story-focus' : ''}`}
              onClick={() => {
                setSelectedScenarioId(scenario.id)
                setApplied(false)
              }}
            >
              <span>{scenario.persona}</span>
              <strong>{scenario.serviceName}</strong>
              <small>{scenario.objective}</small>
            </button>
          ))}
        </div>
      </DataPanel>

      <div className="content-grid content-grid--two">
        <DataPanel
          title="策略参数"
          subtitle={selectedScenario.serviceName}
          aside={<span className={`badge ${applied ? 'badge--success' : 'badge--warning'}`}>{applied ? '策略生效' : '待生效'}</span>}
        >
          <div className="metric-grid">
            <MetricCard label="5QI" value={selectedScenario.strategy.fiveQi} tone="accent" />
            <MetricCard label="RFSP" value={selectedScenario.strategy.rfsp} tone="accent" />
            <MetricCard label="调度优先级" value={selectedScenario.strategy.schedulerPriority} tone="warning" />
            <MetricCard label="关联区段" value={linkedSegment.issueType} note={linkedSegment.label} />
          </div>
          <div className="analysis-grid">
            <article>
              <h4>保障目标</h4>
              <p>{selectedScenario.objective}</p>
            </article>
            <article>
              <h4>策略收益</h4>
              <ul className="callout-list">
                {selectedScenario.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </article>
          </div>
        </DataPanel>

        <DataPanel title="效果验证" subtitle="保障前后对比">
          <div className="before-after-list">
            {selectedScenario.metrics.map((metric) => {
              const beforeWidth = (Math.min(metric.before, metric.after) / Math.max(metric.before, metric.after)) * 100
              const afterWidth = 100
              return (
                <div key={metric.label} className="before-after-row">
                  <div className="before-after-row__header">
                    <strong>{metric.label}</strong>
                    <span>
                      {metric.before}
                      {metric.unit} {'->'} {applied ? metric.after : metric.before}
                      {metric.unit}
                    </span>
                  </div>
                  <div className="before-after-row__bars">
                    <div className="bar-track">
                      <div className="bar-fill bar-fill--before" style={{ width: `${beforeWidth}%` }} />
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill bar-fill--after" style={{ width: `${applied ? afterWidth : beforeWidth}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="toolbar-row">
            <button type="button" className="action-button" onClick={() => setApplied((value) => !value)}>
              {applied ? '查看保障前' : '查看保障后'}
            </button>
            <button type="button" className="action-button" onClick={onJumpToP1}>
              返回问题区段
            </button>
          </div>
        </DataPanel>
      </div>
    </div>
  )
}
