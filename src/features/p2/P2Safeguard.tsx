import { useEffect, useMemo, useState } from 'react'

import { p2PolicyCards } from '../../mock/p2PolicyData'
import type { DemoScene } from '../../types'
import { DataPanel } from '../shared/DataPanel'

interface P2SafeguardProps {
  scene: DemoScene
  highlightMode: boolean
}

export function P2Safeguard({ scene, highlightMode }: P2SafeguardProps) {
  const initialPolicyId = scene.focusScenarioId ?? p2PolicyCards[0].id
  const [selectedPolicyId, setSelectedPolicyId] = useState(initialPolicyId)
  const [isApplied, setIsApplied] = useState(false)
  const [isAppListExpanded, setIsAppListExpanded] = useState(false)

  useEffect(() => {
    setSelectedPolicyId(initialPolicyId)
    setIsApplied(false)
    setIsAppListExpanded(false)
  }, [highlightMode, initialPolicyId, scene.id])

  const selectedPolicy = useMemo(
    () => p2PolicyCards.find((item) => item.id === selectedPolicyId) ?? p2PolicyCards[0],
    [selectedPolicyId],
  )

  const phoneState = isApplied ? selectedPolicy.phoneComparison.after : selectedPolicy.phoneComparison.before

  return (
    <div className="screen-page p2-layout">
      <DataPanel title="保障策略" className="p2-strategy-panel">
        <div className="p2-strategy-toolbar">
          <div className="p2-policy-buttons">
            {p2PolicyCards.map((policy) => (
              <button
                key={policy.id}
                type="button"
                className={`p2-policy-button ${policy.id === selectedPolicy.id ? 'p2-policy-button--active' : ''}`}
                onClick={() => {
                  setSelectedPolicyId(policy.id)
                  setIsApplied(false)
                  setIsAppListExpanded(false)
                }}
              >
                <strong>{policy.name}</strong>
                <span>{policy.summary}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`action-button action-button--accent p2-apply-button ${isApplied ? 'p2-apply-button--applied' : ''}`}
            onClick={() => setIsApplied(true)}
          >
            {isApplied ? '策略已生效' : '策略生效'}
          </button>
        </div>

        <section className="p2-summary-strip">
          <div className="p2-parameter-badges">
            {selectedPolicy.parameterBadges.map((item) => (
              <div key={`${selectedPolicy.id}-${item.label}`} className="p2-parameter-badge">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
            <button
              type="button"
              className="p2-parameter-badge p2-parameter-badge--action"
              onClick={() => setIsAppListExpanded((current) => !current)}
            >
              <span>策略范围</span>
              <strong>{selectedPolicy.scopeLabel}</strong>
              <em>{isAppListExpanded ? '收起 APP 明细' : '查看 APP 明细'}</em>
            </button>
          </div>

          {isAppListExpanded ? (
            <div className="p2-app-sheet">
              {selectedPolicy.appGroups.map((group) => (
                <article key={`${selectedPolicy.id}-${group.category}`} className="p2-app-group">
                  <span>{group.category}</span>
                  <p>{group.apps.join(' / ')}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </DataPanel>

      <div className="p2-dashboard">
        <DataPanel title="保障效果对比" className="p2-phone-panel">
          <div className="p2-phone-grid">
            <article className="p2-phone-card p2-phone-card--vip">
              <header className="p2-phone-card__header">
                <div>
                  <span>权益用户</span>
                </div>
                <em className="p2-phone-status p2-phone-status--vip">{phoneState.vip.status}</em>
              </header>

              <div className="p2-phone-screen">
                <div className="p2-phone-screen__camera" />
                <div className="p2-phone-screen__speaker" />
                <div className="p2-phone-screen__poster p2-phone-screen__poster--vip">
                  <span>{phoneState.vip.experience}</span>
                  <strong>{phoneState.vip.status}</strong>
                  <small>录屏位待替换</small>
                </div>
              </div>
            </article>

            <article className="p2-phone-card">
              <header className="p2-phone-card__header">
                <div>
                  <span>普通用户</span>
                </div>
                <em className="p2-phone-status p2-phone-status--standard">{phoneState.standard.status}</em>
              </header>

              <div className="p2-phone-screen">
                <div className="p2-phone-screen__camera" />
                <div className="p2-phone-screen__speaker" />
                <div className="p2-phone-screen__poster p2-phone-screen__poster--standard">
                  <span>{phoneState.standard.experience}</span>
                  <strong>{phoneState.standard.status}</strong>
                  <small>录屏位待替换</small>
                </div>
              </div>
            </article>
          </div>
        </DataPanel>

        <DataPanel title="关键业务体验差异" className="p2-metrics-panel">
          <div className="p2-metrics-summary">
            <strong>{selectedPolicy.name}</strong>
          </div>

          <div className="p2-metrics-table">
            <div className="p2-metrics-table__header">
              <span>业务指标</span>
              <span>权益用户</span>
              <span>普通用户</span>
              <span>收益</span>
            </div>

            {selectedPolicy.metricRows.map((row) => {
              const current = isApplied ? row.after : row.before
              return (
                <div key={`${selectedPolicy.id}-${row.label}`} className="p2-metrics-table__row">
                  <strong>{row.label}</strong>
                  <span className="p2-metrics-table__value p2-metrics-table__value--vip">{current.vip}</span>
                  <span className="p2-metrics-table__value">{current.standard}</span>
                  <em>{isApplied ? row.improvement : '接近'}</em>
                </div>
              )
            })}
          </div>
        </DataPanel>
      </div>
    </div>
  )
}
