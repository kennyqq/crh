import { useDeferredValue, useEffect, useState } from 'react'

import { complaintCases, lineRiskSegments, railRoutes, trainRuns } from '../../mock/demoData'
import type { ComplaintCase, ComplaintLevel, DemoScene } from '../../types'
import { DataPanel } from '../shared/DataPanel'
import { LineChart } from '../shared/LineChart'
import { MetricCard } from '../shared/MetricCard'
import { RailMap } from '../shared/RailMap'

interface P3ComplaintClosureProps {
  scene: DemoScene
  highlightMode: boolean
}

export function P3ComplaintClosure({ scene, highlightMode }: P3ComplaintClosureProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<'全部' | ComplaintLevel>('全部')
  const [selectedComplaintId, setSelectedComplaintId] = useState(complaintCases[0].id)
  const [frameIndex, setFrameIndex] = useState(60)
  const deferredSearchTerm = useDeferredValue(searchTerm)

  useEffect(() => {
    if (!highlightMode || !scene.focusComplaintId) {
      return
    }

    setSelectedComplaintId(scene.focusComplaintId)
    if (scene.focusFrameIndex !== undefined) {
      setFrameIndex(scene.focusFrameIndex)
    }
  }, [highlightMode, scene])

  const filteredComplaints = complaintCases.filter((complaint) => {
    const matchesLevel = selectedLevel === '全部' || complaint.level === selectedLevel
    const matchesSearch =
      deferredSearchTerm.length === 0 ||
      complaint.title.includes(deferredSearchTerm) ||
      complaint.service.includes(deferredSearchTerm) ||
      complaint.userTag.includes(deferredSearchTerm)
    return matchesLevel && matchesSearch
  })

  const selectedComplaint =
    filteredComplaints.find((complaint) => complaint.id === selectedComplaintId) ??
    complaintCases.find((complaint) => complaint.id === selectedComplaintId) ??
    complaintCases[0]

  const safeFrameIndex = Math.min(frameIndex, Math.max(selectedComplaint.replayFrames.length - 1, 0))
  const currentFrame = selectedComplaint.replayFrames[safeFrameIndex]
  const selectedSegment =
    lineRiskSegments.find((segment) => segment.id === selectedComplaint.segmentId) ?? lineRiskSegments[0]
  const selectedRouteId = selectedComplaint.routeId

  return (
    <div className="screen-page">
      <section className="screen-hero screen-hero--split screen-hero--compact">
        <div>
          <p className="eyebrow">投诉回溯</p>
          <h2>用户投诉闭环分析</h2>
          <p className="screen-hero__summary">
            支持按投诉记录检索线路、车次和业务，回放 5 秒级网络证据，并输出关联告警、问题判断和闭环建议。
          </p>
        </div>
        <div className="metric-grid metric-grid--compact">
          <MetricCard label="当日投诉" value={`${complaintCases.length} 条`} tone="warning" note="匿名化展示" />
          <MetricCard
            label="已闭环"
            value={`${complaintCases.filter((item) => item.status === '已闭环').length} 条`}
            tone="accent"
          />
          <MetricCard label="关联告警" value="4 条" note="窗口内可关联" />
          <MetricCard label="回溯窗口" value="T-5min ~ T+5min" note="5 秒采样" />
        </div>
      </section>

      <div className="toolbar-row">
        <input
          className="search-input"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="搜索投诉标题、业务或匿名用户"
        />
        <div className="chip-group">
          {(['全部', '一般', '严重', '紧急'] as const).map((level) => (
            <button
              key={level}
              type="button"
              className={`chip ${selectedLevel === level ? 'chip--active' : ''}`}
              onClick={() => setSelectedLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="content-grid content-grid--three">
        <DataPanel
          className="complaint-list-panel"
          title="投诉列表"
          subtitle="匿名化投诉工单"
          aside={<span className="badge">{filteredComplaints.length} 条</span>}
        >
          <div className="complaint-list">
            {filteredComplaints.map((complaint) => (
              <button
                key={complaint.id}
                type="button"
                className={`complaint-item ${complaint.id === selectedComplaint.id ? 'complaint-item--active story-focus' : ''}`}
                onClick={() => setSelectedComplaintId(complaint.id)}
              >
                <strong>{complaint.title}</strong>
                <p>{complaint.summary}</p>
                <div className="complaint-item__meta">
                  <span>{complaint.timeLabel}</span>
                  <span>{complaint.level}</span>
                  <span>{complaint.service}</span>
                </div>
              </button>
            ))}
          </div>
        </DataPanel>

        <div className="stack">
          <RailMap
            title="投诉定位"
            subtitle="线路、列车与关联区段回溯"
            routes={railRoutes}
            trains={trainRuns}
            segments={lineRiskSegments}
            selectedRouteId={selectedRouteId}
            selectedTrainId={selectedComplaint.trainId}
            highlightSegmentIds={highlightMode ? scene.focusSegmentIds ?? [selectedComplaint.segmentId] : [selectedComplaint.segmentId]}
            focusPoint={currentFrame.position}
          />
          <LineChart
            title="回溯曲线"
            subtitle="RTT、RSRP 与下行速率联动"
            series={[
              { id: 'rtt', name: 'RTT (ms)', color: '#ff7a48', values: selectedComplaint.replayFrames.map((frame) => frame.rtt) },
              { id: 'signal', name: 'RSRP (dBm)', color: '#7ae5ff', values: selectedComplaint.replayFrames.map((frame) => frame.rsrp) },
              { id: 'speed', name: '下行速率 (Mbps)', color: '#7dffb0', values: selectedComplaint.replayFrames.map((frame) => frame.downlinkMbps) },
            ]}
            activeIndex={safeFrameIndex}
          />
          <div className="timeline-controls">
            <button type="button" className="action-button" onClick={() => setFrameIndex((value) => Math.max(value - 1, 0))}>
              上一帧
            </button>
            <input
              className="range-input"
              type="range"
              min="0"
              max={Math.max(selectedComplaint.replayFrames.length - 1, 0)}
              step="1"
              value={safeFrameIndex}
              onChange={(event) => setFrameIndex(Number(event.target.value))}
            />
            <button
              type="button"
              className="action-button"
              onClick={() => setFrameIndex((value) => Math.min(value + 1, selectedComplaint.replayFrames.length - 1))}
            >
              下一帧
            </button>
          </div>
        </div>

        <ComplaintDetailCard
          complaint={selectedComplaint}
          currentFrameIndex={safeFrameIndex}
          currentFrame={currentFrame}
          selectedSegmentName={selectedSegment.issueType}
        />
      </div>
    </div>
  )
}

interface ComplaintDetailCardProps {
  complaint: ComplaintCase
  currentFrameIndex: number
  currentFrame: ComplaintCase['replayFrames'][number]
  selectedSegmentName: string
}

function ComplaintDetailCard({
  complaint,
  currentFrameIndex,
  currentFrame,
  selectedSegmentName,
}: ComplaintDetailCardProps) {
  return (
    <section className="stack">
      <DataPanel
        title="投诉详情"
        subtitle={complaint.userTag}
        aside={<span className="badge badge--warning">{complaint.status}</span>}
      >
        <div className="metric-grid">
          <MetricCard label="投诉业务" value={complaint.service} note={complaint.title} />
          <MetricCard label="当前帧偏移" value={`${currentFrame.offsetSeconds}s`} tone="accent" note={`第 ${currentFrameIndex + 1} 帧`} />
          <MetricCard
            label="驻留网络"
            value={currentFrame.networkMode}
            tone={currentFrame.networkMode === '4G' ? 'warning' : 'default'}
            note={selectedSegmentName}
          />
          <MetricCard label="关联告警" value={currentFrame.alert ?? complaint.analysis.relatedAlert} tone="critical" />
        </div>
      </DataPanel>

      <DataPanel
        title="问题分析"
        subtitle={complaint.analysis.probableCause}
        aside={<span className="badge badge--success">{Math.round(complaint.analysis.confidence * 100)}%</span>}
      >
        <ul className="callout-list">
          {complaint.analysis.evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="panel__summary">{complaint.analysis.historicalMatch}</p>
      </DataPanel>

      <DataPanel title="闭环建议" subtitle="处置动作建议">
        <div className="closure-list">
          {complaint.recommendations.map((recommendation) => (
            <article key={recommendation.id} className="closure-item">
              <div>
                <strong>{recommendation.title}</strong>
                <p>{recommendation.action}</p>
              </div>
              <div className="closure-item__meta">
                <span>{recommendation.category}</span>
                <span>{recommendation.owner}</span>
                <span>{recommendation.eta}</span>
              </div>
            </article>
          ))}
        </div>
      </DataPanel>
    </section>
  )
}
