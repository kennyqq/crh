import { useEffect, useMemo, useState } from 'react'

import { p1RouteProfile } from '../../mock/p1CorridorData'
import type { DemoScene, P1IssueType, P1MetricKey } from '../../types'
import { DataPanel } from '../shared/DataPanel'
import { P1CorridorMap } from './P1CorridorMap'
import { P1Timeline } from './P1Timeline'

interface P1InsightsProps {
  scene: DemoScene
  highlightMode: boolean
}

function getScenePreset(sceneId: string): { metric: P1MetricKey; issueType: P1IssueType } {
  if (sceneId === 'scene-p1-coverage') {
    return { metric: 'serviceComposite', issueType: 'fiveGAbnormal' }
  }

  if (sceneId === 'scene-p1-issue') {
    return { metric: 'rsrp', issueType: 'coverageFault' }
  }

  return { metric: 'rsrp', issueType: 'spacing' }
}

export function P1Insights({ scene, highlightMode }: P1InsightsProps) {
  const preset = getScenePreset(scene.id)
  const [selectedMetric, setSelectedMetric] = useState<P1MetricKey>(preset.metric)
  const [selectedSliceId, setSelectedSliceId] = useState<string>(p1RouteProfile.defaultSliceId)
  const [selectedIssueType, setSelectedIssueType] = useState<P1IssueType>(preset.issueType)
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null)

  const selectedSlice = useMemo(
    () =>
      p1RouteProfile.timelineSlices.find((slice) => slice.id === selectedSliceId) ??
      p1RouteProfile.timelineSlices[0],
    [selectedSliceId],
  )

  const issueRows = selectedSlice.issueOccurrences

  useEffect(() => {
    if (highlightMode) {
      setSelectedMetric(preset.metric)
      setSelectedSliceId(p1RouteProfile.defaultSliceId)
      setSelectedIssueType(preset.issueType)
      setExpandedIssueId(null)
    }
  }, [highlightMode, preset.issueType, preset.metric])

  useEffect(() => {
    const activeType =
      issueRows.find((item) => item.type === selectedIssueType)?.type ?? selectedSlice.primaryIssueType

    setSelectedIssueType(activeType)
    setExpandedIssueId((current) => {
      if (!current) {
        return null
      }

      return issueRows.some((item) => item.id === current) ? current : null
    })
  }, [issueRows, selectedIssueType, selectedSlice.primaryIssueType])

  return (
    <div className="screen-page">
      <div className="p1-dashboard">
        <section className="p1-map-column">
          <P1CorridorMap
            profile={p1RouteProfile}
            selectedSlice={selectedSlice}
            selectedMetric={selectedMetric}
            selectedIssueType={selectedIssueType}
            onSelectIssueType={setSelectedIssueType}
          />
          <P1Timeline
            slices={p1RouteProfile.timelineSlices}
            selectedSliceId={selectedSlice.id}
            onSelectSlice={setSelectedSliceId}
          />
        </section>

        <aside className="p1-sidebar">
          <DataPanel title={p1RouteProfile.speedInsight.title} className="p1-panel-compact">
            <div className="p1-table-card">
              <div className="p1-kqi-table">
                {selectedSlice.metrics.speedRows.map((item) => (
                  <div key={item.label} className="p1-kqi-table__row">
                    <span>{item.label}</span>
                    <strong className={`p1-kqi-table__value p1-kqi-table__value--${item.tone ?? 'default'}`}>
                      {item.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </DataPanel>

          <DataPanel title={p1RouteProfile.serviceInsight.title} className="p1-panel-compact">
            <div className="p1-table-card">
              <div className="p1-kqi-table">
                {selectedSlice.metrics.serviceRows.map((item) => (
                  <div key={item.label} className="p1-kqi-table__row">
                    <span>{item.label}</span>
                    <strong className={`p1-kqi-table__value p1-kqi-table__value--${item.tone ?? 'default'}`}>
                      {item.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </DataPanel>

          <DataPanel title="主要问题列表" className="p1-panel-compact">
            <div className="p1-issue-table">
              <div className="p1-issue-table__header">
                <span>问题描述</span>
                <span>数量</span>
                <span>位置</span>
                <span>闭环</span>
                <span>建议</span>
              </div>

              <div className="p1-issue-list">
                {issueRows.map((item) => {
                  const isActive = item.type === selectedIssueType
                  const isExpanded = expandedIssueId === item.id

                  return (
                    <div key={item.id} className={`p1-issue-list__item ${isActive ? 'p1-issue-list__item--active' : ''}`}>
                      <div
                        className={`p1-issue-list__row ${isActive ? 'p1-issue-list__row--active' : ''}`}
                        onClick={() => setSelectedIssueType(item.type)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedIssueType(item.type)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <strong>{item.label}</strong>
                        <em>{item.countLabel}</em>
                        <span className="p1-issue-list__location">{item.locationLabel}</span>
                        <span className={`p1-issue-list__status ${item.closed ? 'p1-issue-list__status--closed' : ''}`}>
                          {item.closed ? '是' : '否'}
                        </span>
                        <span className="p1-issue-list__action">
                          <button
                            type="button"
                            className={`p1-issue-list__icon ${isExpanded ? 'p1-issue-list__icon--active' : ''}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              setExpandedIssueId((current) => (current === item.id ? null : item.id))
                              setSelectedIssueType(item.type)
                            }}
                            aria-label={`查看${item.label}详情`}
                          >
                            i
                          </button>
                        </span>
                      </div>

                      {isExpanded ? (
                        <div className="p1-issue-list__detail">
                          <div>
                            <span>处理建议</span>
                            <strong>{item.recommendation}</strong>
                          </div>
                          <div>
                            <span>关联车次</span>
                            <strong>
                              {item.trainNo} / {item.trainType}
                            </strong>
                          </div>
                          <p>{item.detail}</p>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </DataPanel>
        </aside>
      </div>
    </div>
  )
}
