import { useEffect, useRef, useState } from 'react'

import type { Coordinates, P1IssueType, P1MetricKey, P1RouteProfile, P1TimelineSlice } from '../../types'

interface P1CorridorMapProps {
  profile: P1RouteProfile
  selectedSlice: P1TimelineSlice
  selectedMetric: P1MetricKey
  selectedIssueType: P1IssueType
  onSelectIssueType: (issueType: P1IssueType) => void
}

interface P1MapInstances {
  map: any
  AMap: any
}

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE
const AMAP_SCRIPT_ID = 'amap-jsapi-v2-p1'

let amapOnlyPromise: Promise<any> | null = null

function appendAmapScript(key: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(AMAP_SCRIPT_ID) as HTMLScriptElement | null

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve()
        return
      }

      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load AMap')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = AMAP_SCRIPT_ID
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    script.async = true
    script.defer = true

    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }

    script.onerror = () => reject(new Error('Failed to load AMap'))
    document.head.appendChild(script)
  })
}

function loadAmapOnly(key: string, securityJsCode?: string) {
  if (!key) {
    return Promise.reject(new Error('Missing AMap key'))
  }

  if (securityJsCode) {
    window._AMapSecurityConfig = {
      ...(window._AMapSecurityConfig ?? {}),
      securityJsCode,
    }
  }

  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }

  if (!amapOnlyPromise) {
    amapOnlyPromise = appendAmapScript(key)
      .then(() => {
        if (!window.AMap) {
          throw new Error('AMap unavailable after load')
        }
        return window.AMap
      })
      .catch((error) => {
        amapOnlyPromise = null
        throw error
      })
  }

  return amapOnlyPromise
}

interface CorridorFrame {
  minLat: number
  maxLat: number
  centerLng: number
  lngSpan: number
}

function isValidCoordinate(point: Coordinates | undefined | null): point is Coordinates {
  return Array.isArray(point) && point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1])
}

function getHeatColor(value: number) {
  if (value > -103) return '#46c96b'
  if (value > -110) return '#f0c24f'
  return '#cf4a45'
}

function getIssueStateColor(type: P1IssueType, primaryIssueType: P1IssueType, activeIssueTypes: P1IssueType[]) {
  if (type === primaryIssueType) {
    return '#8f2530'
  }

  if (activeIssueTypes.includes(type)) {
    return '#d88b2a'
  }

  return '#3f84d6'
}

function getRepresentativeIssue(profile: P1RouteProfile, issueType: P1IssueType) {
  const binding = profile.issueBindings.find((item) => item.issueType === issueType)
  const defaultSlice = profile.timelineSlices.find((slice) => slice.id === binding?.defaultSliceId) ?? profile.timelineSlices[0]
  return defaultSlice.issueOccurrences.find((item) => item.type === issueType) ?? defaultSlice.issueOccurrences[0]
}

function buildFrame(profile: P1RouteProfile): CorridorFrame {
  const points = [
    ...profile.routePoints,
    ...profile.trackSamples.map((sample) => sample.position),
    ...profile.issueMarkers.map((marker) => marker.position),
    ...profile.stations.map((station) => station.position),
  ].filter(isValidCoordinate)

  const lats = points.map((point) => point[1])
  const lngs = points.map((point) => point[0])
  const centerLng = profile.routePoints.reduce((sum, point) => sum + point[0], 0) / profile.routePoints.length

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    centerLng,
    lngSpan: Math.max(Math.max(...lngs) - Math.min(...lngs), 0.22),
  }
}

function projectPoint(point: Coordinates, frame: CorridorFrame) {
  const height = 780
  const topPadding = 42
  const bottomPadding = 52
  const centerX = 500
  const lateralAmplitude = 18
  const meanderAmplitude = 10
  const safeLatSpan = frame.maxLat - frame.minLat || 1
  const progress = (frame.maxLat - point[1]) / safeLatSpan
  const deviation = (point[0] - frame.centerLng) / frame.lngSpan
  const x = centerX + deviation * lateralAmplitude + Math.sin(progress * Math.PI * 1.2) * meanderAmplitude
  const y = topPadding + progress * (height - topPadding - bottomPadding)

  return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const
}

function getStationLabelOffset(index: number) {
  const presets = [
    { x: 10, y: -12, anchor: 'left' as const },
    { x: -10, y: -12, anchor: 'right' as const },
    { x: 10, y: 18, anchor: 'left' as const },
    { x: -10, y: 18, anchor: 'right' as const },
  ]

  return presets[index % presets.length]
}

function buildIssuePinElement(label: string, issueColor: string, active: boolean, muted: boolean, onSelect: () => void) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = ['p1-amap-issue-pin', active ? 'p1-amap-issue-pin--active' : '', muted ? 'p1-amap-issue-pin--muted' : '']
    .filter(Boolean)
    .join(' ')
  button.style.setProperty('--issue-color', issueColor)
  button.setAttribute('aria-label', `查看${label}详情`)
  button.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    onSelect()
  })
  return button
}

function renderFallbackSvg(
  profile: P1RouteProfile,
  selectedIssueType: P1IssueType,
  selectedSlice: P1TimelineSlice,
  onSelectIssueType: (issueType: P1IssueType) => void,
) {
  const frame = buildFrame(profile)
  const activeIssueTypes = selectedSlice.activeIssueTypes
  const primaryIssueType = selectedSlice.primaryIssueType
  const selectedIssue =
    selectedSlice.issueOccurrences.find((item) => item.type === selectedIssueType) ?? getRepresentativeIssue(profile, selectedIssueType)
  const routePolyline = profile.routePoints.map((point) => projectPoint(point, frame).join(',')).join(' ')

  return (
    <svg className="p1-map-svg" viewBox="0 0 1000 780" aria-label="京广高速线感知洞察地图">
      <rect className="p1-map-svg__bg" x="0" y="0" width="1000" height="780" rx="28" />
      <g className="p1-map-svg__mesh">
        {Array.from({ length: 7 }, (_, index) => (
          <line key={`vertical-${index}`} x1={338 + index * 54} x2={338 + index * 54} y1="42" y2="736" />
        ))}
        {Array.from({ length: 7 }, (_, index) => (
          <line key={`horizontal-${index}`} x1="244" x2="756" y1={96 + index * 88} y2={96 + index * 88} />
        ))}
      </g>

      <polyline className="p1-map-svg__route-base" points={routePolyline} />

      {profile.trackSamples.slice(0, -1).map((sample, index) => {
        const nextSample = profile.trackSamples[index + 1]
        const [x1, y1] = projectPoint(sample.position, frame)
        const [x2, y2] = projectPoint(nextSample.position, frame)

        return (
          <line
            key={`sample-segment-${sample.id}`}
            className="p1-map-svg__route-line"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={getHeatColor(sample.values.rsrp)}
          />
        )
      })}

      {profile.trackSamples.map((sample, index) => {
        const [x, y] = projectPoint(sample.position, frame)
        return <circle key={sample.id} className="p1-map-svg__sample" cx={x} cy={y} r={index % 4 === 0 ? 3.2 : 2.4} fill={getHeatColor(sample.values.rsrp)} />
      })}

      {profile.stations.map((station, stationIndex) => {
        const [x, y] = projectPoint(station.position, frame)
        const labelOffset = getStationLabelOffset(stationIndex)

        return (
          <g key={station.id}>
            <circle className="p1-map-svg__station" cx={x} cy={y} r="4.8" />
            <text
              className={`p1-map-svg__station-label p1-map-svg__station-label--${labelOffset.anchor}`}
              x={x + labelOffset.x}
              y={y + labelOffset.y}
            >
              {station.label}
            </text>
          </g>
        )
      })}

      {profile.issueMarkers.map((marker) => {
        const [x, y] = projectPoint(marker.position, frame)
        const isSelected = marker.type === selectedIssue.type
        const isEmphasized = isSelected || activeIssueTypes.includes(marker.type)
        const issueColor = getIssueStateColor(marker.type, primaryIssueType, activeIssueTypes)

        return (
          <g
            key={marker.id}
            className={`p1-map-svg__issue-group ${isSelected ? 'p1-map-svg__issue-group--active' : ''} ${isEmphasized ? '' : 'p1-map-svg__issue-group--muted'}`.trim()}
          >
            <circle className="p1-map-svg__issue-halo" cx={x} cy={y} r="16" fill={issueColor} />
            <circle className="p1-map-svg__issue" cx={x} cy={y} r={isSelected ? 8.2 : 6.8} fill={issueColor} />
            <circle className="p1-map-svg__issue-core" cx={x} cy={y} r={isSelected ? 3.2 : 2.6} fill="#ffffff" />
            <circle className="p1-map-svg__issue-hit" cx={x} cy={y} r="30" onClick={() => onSelectIssueType(marker.type)} aria-label={`查看${marker.label}详情`} />
          </g>
        )
      })}
    </svg>
  )
}

export function P1CorridorMap({ profile, selectedMetric, selectedSlice, selectedIssueType, onSelectIssueType }: P1CorridorMapProps) {
  const [renderMode, setRenderMode] = useState<'amap' | 'fallback-svg'>(AMAP_KEY ? 'amap' : 'fallback-svg')
  const [mapReady, setMapReady] = useState(false)
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const instancesRef = useRef<P1MapInstances | null>(null)

  const activeIssueTypes = selectedSlice.activeIssueTypes
  const primaryIssueType = selectedSlice.primaryIssueType
  const selectedIssue =
    selectedSlice.issueOccurrences.find((item) => item.type === selectedIssueType) ?? getRepresentativeIssue(profile, selectedIssueType)

  useEffect(() => {
    const host = mapHostRef.current
    if (!host || !AMAP_KEY) {
      setRenderMode('fallback-svg')
      return
    }

    let cancelled = false
    host.innerHTML = ''

    loadAmapOnly(AMAP_KEY, AMAP_SECURITY_CODE)
      .then((AMap) => {
        if (cancelled || !mapHostRef.current) {
          return
        }

        const map = new AMap.Map(mapHostRef.current, {
          viewMode: '2D',
          zoom: 7.95,
          center: profile.routePoints[Math.floor(profile.routePoints.length / 2)],
          pitch: 0,
          rotation: 0,
          mapStyle: 'amap://styles/dark',
          resizeEnable: true,
          showLabel: true,
        })

        instancesRef.current = { map, AMap }
        setRenderMode('amap')
        setMapReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setRenderMode('fallback-svg')
        }
      })

    return () => {
      cancelled = true
      const instances = instancesRef.current
      if (instances) {
        try {
          instances.map.clearMap()
        } catch {
          // ignore
        }
        try {
          instances.map.destroy()
        } catch {
          // ignore
        }
      }
      instancesRef.current = null
      setMapReady(false)
      if (mapHostRef.current) {
        mapHostRef.current.innerHTML = ''
      }
    }
  }, [profile.routePoints])

  useEffect(() => {
    if (renderMode !== 'amap' || !mapReady) {
      return
    }

    const instances = instancesRef.current
    if (!instances) {
      return
    }

    const { map, AMap } = instances
    try {
      map.clearMap()
    } catch {
      // ignore
    }

    const overlays: any[] = []

    const routeOverlay = new AMap.Polyline({
      path: profile.routePoints,
      strokeColor: 'rgba(70, 201, 107, 0.14)',
      strokeWeight: 14,
      lineCap: 'round',
      lineJoin: 'round',
      zIndex: 10,
    })
    overlays.push(routeOverlay)

    profile.trackSamples.slice(0, -1).forEach((sample, index) => {
      const nextSample = profile.trackSamples[index + 1]
      overlays.push(
        new AMap.Polyline({
          path: [sample.position, nextSample.position],
          strokeColor: getHeatColor(sample.values.rsrp),
          strokeWeight: 5,
          strokeOpacity: 0.96,
          lineCap: 'round',
          lineJoin: 'round',
          zIndex: 18,
        }),
      )
    })

    profile.trackSamples.forEach((sample, index) => {
      overlays.push(
        new AMap.CircleMarker({
          center: sample.position,
          radius: index % 5 === 0 ? 3.8 : 3.1,
          fillColor: getHeatColor(sample.values.rsrp),
          fillOpacity: 0.98,
          strokeColor: 'rgba(255,255,255,0.62)',
          strokeWeight: 1,
          zIndex: 22,
        }),
      )
    })

    profile.stations.forEach((station, stationIndex) => {
      const labelOffset = getStationLabelOffset(stationIndex)
      overlays.push(
        new AMap.CircleMarker({
          center: station.position,
          radius: 4.4,
          fillColor: '#ffe07d',
          fillOpacity: 1,
          strokeColor: 'rgba(255,255,255,0.92)',
          strokeWeight: 1.2,
          zIndex: 30,
        }),
      )

      overlays.push(
        new AMap.Text({
          text: station.label,
          position: station.position,
          offset: new AMap.Pixel(labelOffset.x, labelOffset.y),
          anchor: labelOffset.anchor === 'left' ? 'middle-left' : 'middle-right',
          style: {
            color: 'rgba(230, 245, 255, 0.8)',
            fontSize: '13px',
            fontWeight: '600',
            background: 'transparent',
            border: 'none',
            padding: '0',
            textShadow: '0 0 8px rgba(0, 0, 0, 0.72)',
          },
          zIndex: 32,
        }),
      )
    })

    profile.issueMarkers.forEach((marker) => {
      const issueColor = getIssueStateColor(marker.type, primaryIssueType, activeIssueTypes)
      const isSelected = marker.type === selectedIssue.type
      const isMuted = !isSelected && !activeIssueTypes.includes(marker.type)
      const content = buildIssuePinElement(marker.label, issueColor, isSelected, isMuted, () => onSelectIssueType(marker.type))

      overlays.push(
        new AMap.Marker({
          position: marker.position,
          offset: new AMap.Pixel(-15, -15),
          content,
          zIndex: isSelected ? 60 : 52,
        }),
      )
    })

    map.add(overlays)
    map.setFitView([routeOverlay], false, [36, 36, 92, 276])
    map.resize?.()
  }, [activeIssueTypes, mapReady, onSelectIssueType, primaryIssueType, profile, renderMode, selectedIssue.type, selectedMetric])

  return (
    <div className="p1-map-shell">
      <div ref={mapHostRef} className={`p1-map-host ${renderMode !== 'amap' ? 'p1-map-host--hidden' : ''}`} />
      {renderMode === 'fallback-svg' ? renderFallbackSvg(profile, selectedIssueType, selectedSlice, onSelectIssueType) : null}

      <div className="p1-map-overlay">
        <div className="p1-map-overlay__title">
          <span>线路感知洞察</span>
          <h2>
            {profile.lineName} - {selectedIssue.locationLabel}
          </h2>
        </div>
        <div className="p1-signal-summary">
          {selectedSlice.metrics.signalSummary.map((item) => (
            <div key={item.label} className={`p1-signal-summary__item p1-signal-summary__item--${item.tone ?? 'default'}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="p1-map-focus p1-map-focus--detail">
        <span>
          {selectedSlice.timeLabel} / {selectedIssue.locationLabel}
        </span>
        <strong>{selectedIssue.label}</strong>
        <div className="p1-map-focus__grid">
          <div>
            <small>线路段 / 小区</small>
            <b>{selectedIssue.siteLabel}</b>
          </div>
          <div>
            <small>是否闭环</small>
            <b className={selectedIssue.closed ? 'p1-map-focus__status--closed' : ''}>{selectedIssue.closed ? '已闭环' : '未闭环'}</b>
          </div>
          <div>
            <small>关联车次</small>
            <b>
              {selectedIssue.trainNo} / {selectedIssue.trainType}
            </b>
          </div>
          <div>
            <small>建议动作</small>
            <b>{selectedIssue.recommendation}</b>
          </div>
        </div>
        <p>{selectedIssue.detail}</p>
      </div>

      <div className="p1-map-legend">
        <div className="p1-map-legend__group">
          <span className="p1-map-legend__title">信号电平 RSRP</span>
          {[
            ['差', '#cf4a45'],
            ['良', '#f0c24f'],
            ['优', '#46c96b'],
          ].map(([label, color]) => (
            <span key={label} className="p1-map-legend__item">
              <i style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
        <div className="p1-map-legend__group">
          <span className="p1-map-legend__title">告警点</span>
          <span className="p1-map-legend__item">
            <i style={{ background: '#8f2530' }} />
            主告警
          </span>
          <span className="p1-map-legend__item">
            <i style={{ background: '#d88b2a' }} />
            当前切片告警
          </span>
          <span className="p1-map-legend__item">
            <i style={{ background: '#3f84d6' }} />
            其他告警
          </span>
        </div>
      </div>
    </div>
  )
}
