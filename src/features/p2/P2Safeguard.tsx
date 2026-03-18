import { useEffect, useMemo, useRef, useState } from 'react'

import { p2PolicyCards } from '../../mock/p2PolicyData'
import type { DemoScene } from '../../types'
import { DataPanel } from '../shared/DataPanel'

interface P2SafeguardProps {
  scene: DemoScene
  highlightMode: boolean
}

// 极简手机框组件 - 只保留外框和全屏视频
// 视频文件存放位置: public/videos/
// - before.mp4: 策略生效前（两个手机都卡顿）
// - after_vip.mp4: 策略生效后 - 权益用户流畅
// - after_standard.mp4: 策略生效后 - 普通用户卡顿
function PhoneFrame({ videoSrc, isVip }: { videoSrc: string; isVip: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  
  // 当视频源变化时，重新加载并播放
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch(() => {
        setIsPlaying(false)
      })
      setIsPlaying(true)
    }
  }, [videoSrc])
  
  // 点击切换播放/暂停
  const handleClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }
  
  return (
    <div 
      className={`p2-phone-frame ${isVip ? 'p2-phone-frame--vip' : ''} ${!isPlaying ? 'p2-phone-frame--paused' : ''}`}
      onClick={handleClick}
    >
      {/* 手机外框 */}
      <div className="p2-phone-shell">
        {/* 全屏视频播放器 - 自动播放、静音、循环 */}
        <video
          ref={videoRef}
          className="p2-phone-video"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        {/* 暂停提示图标 */}
        {!isPlaying && (
          <div className="p2-phone-play-overlay">
            <div className="p2-phone-play-icon">▶</div>
          </div>
        )}
      </div>
    </div>
  )
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

  // 根据 isApplied 状态确定视频源
  const vipVideo = isApplied ? '/videos/after_vip.mp4' : '/videos/before.mp4'
  const standardVideo = isApplied ? '/videos/after_standard.mp4' : '/videos/before.mp4'

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
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`action-button action-button--accent p2-apply-button ${isApplied ? 'p2-apply-button--applied' : ''}`}
            onClick={() => setIsApplied(true)}
          >
            {isApplied ? '已生效' : '策略生效'}
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
          </div>

          <button
            type="button"
            className="p2-parameter-badge p2-parameter-badge--action"
            onClick={() => setIsAppListExpanded((current) => !current)}
          >
            <strong>{selectedPolicy.scopeLabel}</strong>
            <em>{isAppListExpanded ? '收起 APP 明细' : '查看 APP 明细'}</em>
          </button>

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
            <PhoneFrame videoSrc={vipVideo} isVip />
            <PhoneFrame videoSrc={standardVideo} isVip={false} />
          </div>
        </DataPanel>

        <DataPanel title="关键业务体验差异" className="p2-metrics-panel">
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
