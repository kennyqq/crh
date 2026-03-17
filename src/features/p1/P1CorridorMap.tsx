import { useEffect, useMemo, useRef, useState } from 'react'

import { loadAmapLoca } from '../p0/amapLocaLoader'
import type {
  Coordinates,
  MapRenderMode,
  P1IssueType,
  P1MetricKey,
  P1RouteProfile,
  P1TimelineSlice,
} from '../../types'

interface P1CorridorMapProps {
  profile: P1RouteProfile
  selectedSlice: P1TimelineSlice
  selectedMetric: P1MetricKey
  selectedIssueType: P1IssueType
  onSelectIssueType: (issueType: P1IssueType) => void
}

function getHeatColor(metric: P1MetricKey, value: number) {
  switch (metric) {
    case 'rsrp':
      if (value > -95) return '#25e5ff'
      if (value > -102) return '#44df7e'
      if (value > -108) return '#f9c74f'
      return '#ff5a5f'
    case 'sinr':
      if (value > 15) return '#25e5ff'
      if (value > 10) return '#44df7e'
      if (value > 5) return '#f9c74f'
      return '#ff5a5f'
    case 'uplinkAvg':
      if (value > 4) return '#25e5ff'
      if (value > 2.6) return '#44df7e'
      if (value > 1.2) return '#f9c74f'
      return '#ff5a5f'
    case 'downlinkAvg':
      if (value > 42) return '#25e5ff'
      if (value > 34) return '#44df7e'
      if (value > 24) return '#f9c74f'
      return '#ff5a5f'
    case 'serviceComposite':
    default:
      if (value > 90) return '#25e5ff'
      if (value > 76) return '#44df7e'
      if (value > 58) return '#f9c74f'
      return '#ff5a5f'
  }
}

function getIssueStateColor(type: P1IssueType, primaryIssueType: P1IssueType, activeIssueTypes: P1IssueType[]) {
  if (type === primaryIssueType) {
    return '#ff5a5f'
  }

  if (activeIssueTypes.includes(type)) {
    return '#f9c74f'
  }

  return '#25e5ff'
}

function isValidCoordinate(point: Coordinates | undefined | null): point is Coordinates {
  return Array.isArray(point) && point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1])
}

function buildBounds(profile: P1RouteProfile) {
  const points = [
    ...profile.routePoints,
    ...profile.trackSamples.map((sample) => sample.position),
    ...profile.issueMarkers.map((marker) => marker.position),
    ...profile.stations.map((station) => station.position),
  ].filter(isValidCoordinate)

  if (points.length === 0) {
    return {
      minLng: 0,
      maxLng: 1,
      minLat: 0,
      maxLat: 1,
    }
  }

  const lngs = points.map((point) => point[0])
  const lats = points.map((point) => point[1])

  return {
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  }
}

function projectPoint(point: Coordinates, bounds: ReturnType<typeof buildBounds>) {
  const padding = 32
  const width = 1000 - padding * 2
  const height = 720 - padding * 2
  const x = padding + ((point[0] - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * width
  const y = 720 - padding - ((point[1] - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * height
  return [x, y] as const
}

function getStationLabelOffset(index: number) {
  const presets = [
    { x: 10, y: -14, anchor: 'left' as const },
    { x: -10, y: -14, anchor: 'right' as const },
    { x: 10, y: 18, anchor: 'left' as const },
    { x: -10, y: 18, anchor: 'right' as const },
  ]

  return presets[index % presets.length]
}

export function P1CorridorMap({
  profile,
  selectedSlice,
  selectedMetric,
  selectedIssueType,
  onSelectIssueType,
}: P1CorridorMapProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const amapRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  const [renderMode, setRenderMode] = useState<MapRenderMode>('fallback-svg')

  const bounds = useMemo(() => buildBounds(profile), [profile])
  const validRoutePoints = useMemo(() => profile.routePoints.filter(isValidCoordinate), [profile.routePoints])
  const validTrackSamples = useMemo(
    () => profile.trackSamples.filter((sample) => isValidCoordinate(sample.position)),
    [profile.trackSamples],
  )
  const validStations = useMemo(
    () => profile.stations.filter((station) => isValidCoordinate(station.position)),
    [profile.stations],
  )
  const validIssueMarkers = useMemo(
    () => profile.issueMarkers.filter((marker) => isValidCoordinate(marker.position)),
    [profile.issueMarkers],
  )

  const activeIssueTypes = selectedSlice.activeIssueTypes
  const primaryIssueType = selectedSlice.primaryIssueType
  const selectedIssue =
    selectedSlice.issueOccurrences.find((item) => item.type === selectedIssueType) ??
    selectedSlice.issueOccurrences[0]

  function removeTrackedOverlays(map: any) {
    overlaysRef.current.forEach((overlay) => {
      try {
        map?.remove?.(overlay)
      } catch {
        // Ignore AMap cleanup issues during screen switching.
      }
    })
    overlaysRef.current = []
  }

  useEffect(() => {
    if (!hostRef.current) {
      return
    }

    const key = import.meta.env.VITE_AMAP_KEY
    const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_CODE

    if (!key) {
      setRenderMode('fallback-svg')
      return
    }

    let cancelled = false

    loadAmapLoca(key, securityJsCode)
      .then(({ AMap }) => {
        if (cancelled || !hostRef.current || validRoutePoints.length === 0) {
          return
        }

        amapRef.current = AMap
        hostRef.current.innerHTML = ''

        mapRef.current = new AMap.Map(hostRef.current, {
          mapStyle: 'amap://styles/dark',
          viewMode: '3D',
          showLabel: false,
          zooms: [6, 18],
          zoom: 8.7,
          center: validRoutePoints[Math.floor(validRoutePoints.length / 2)],
          pitch: 0,
          rotation: 0,
          features: ['bg', 'road'],
        })

        requestAnimationFrame(() => {
          mapRef.current?.resize?.()
        })
        window.setTimeout(() => {
          mapRef.current?.resize?.()
        }, 120)

        setRenderMode('amap')
      })
      .catch(() => {
        if (!cancelled) {
          setRenderMode('fallback-svg')
        }
      })

    return () => {
      cancelled = true
      overlaysRef.current = []
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [profile, validRoutePoints])

  useEffect(() => {
    if (renderMode !== 'amap' || !mapRef.current || !amapRef.current || validRoutePoints.length < 2) {
      return
    }

    const AMap = amapRef.current
    const map = mapRef.current
    const overlays: any[] = []

    removeTrackedOverlays(map)

    const focusOverlay = new AMap.Polyline({
      path: validRoutePoints,
      strokeColor: '#8cf4ff',
      strokeOpacity: 0.2,
      strokeWeight: 10,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      zIndex: 10,
    })

    overlays.push(focusOverlay)

    validTrackSamples.forEach((sample, index) => {
      if (index < validTrackSamples.length - 1) {
        const nextSample = validTrackSamples[index + 1]
        overlays.push(
          new AMap.Polyline({
            path: [sample.position, nextSample.position],
            strokeColor: getHeatColor(selectedMetric, sample.values[selectedMetric]),
            strokeOpacity: 0.92,
            strokeWeight: 6,
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
            zIndex: 20,
          }),
        )
      }

      overlays.push(
        new AMap.CircleMarker({
          center: sample.position,
          radius: index % 4 === 0 ? 3.7 : 2.7,
          strokeColor: 'rgba(255,255,255,0.75)',
          strokeWeight: 0.8,
          fillColor: getHeatColor(selectedMetric, sample.values[selectedMetric]),
          fillOpacity: 0.98,
          zIndex: 26,
        }),
      )
    })

    validStations.forEach((station) => {
      const stationIndex = validStations.findIndex((item) => item.id === station.id)
      const labelOffset = getStationLabelOffset(stationIndex)

      overlays.push(
        new AMap.CircleMarker({
          center: station.position,
          radius: 5,
          strokeColor: '#ffffff',
          strokeWeight: 1.2,
          fillColor: '#ffe08a',
          fillOpacity: 0.95,
          zIndex: 30,
        }),
      )

      overlays.push(
        new AMap.Text({
          text: station.label,
          position: station.position,
          offset: new AMap.Pixel(labelOffset.x, labelOffset.y),
          anchor: labelOffset.anchor,
          style: {
            padding: '0',
            border: 'none',
            background: 'transparent',
            color: 'rgba(231, 243, 255, 0.76)',
            fontSize: '12px',
            fontWeight: '500',
            textShadow: '0 0 8px rgba(0, 0, 0, 0.55)',
          },
          zIndex: 31,
        }),
      )
    })

    validIssueMarkers.forEach((marker) => {
      const isVisible = activeIssueTypes.includes(marker.type)
      const isSelected = marker.type === selectedIssue.type
      const issueColor = getIssueStateColor(marker.type, primaryIssueType, activeIssueTypes)
      const content = document.createElement('button')
      content.type = 'button'
      content.className = `p1-amap-issue-pin ${isSelected ? 'p1-amap-issue-pin--active' : ''} ${isVisible ? '' : 'p1-amap-issue-pin--muted'}`.trim()
      content.style.setProperty('--issue-color', issueColor)
      content.setAttribute('aria-label', marker.label)
      content.onclick = (event) => {
        event.stopPropagation()
        onSelectIssueType(marker.type)
      }

      const markerOverlay = new AMap.Marker({
        position: marker.position,
        content,
        offset: new AMap.Pixel(-15, -15),
      })

      overlays.push(markerOverlay)
    })

    if (overlays.length > 0) {
      map.add(overlays)
    }

    overlaysRef.current = overlays
    map.setRotation?.(0)
    map.setFitView([focusOverlay], false, [84, 30, 128, 286], 10)

    requestAnimationFrame(() => {
      map.resize?.()
      map.setRotation?.(0)
      map.setFitView([focusOverlay], false, [84, 30, 128, 286], 10)
    })

    return () => {
      removeTrackedOverlays(map)
    }
  }, [
    activeIssueTypes,
    onSelectIssueType,
    profile,
    renderMode,
    selectedIssue.type,
    selectedMetric,
    validIssueMarkers,
    validRoutePoints,
    validStations,
    validTrackSamples,
  ])

  return (
    <div className="p1-map-shell">
      <div ref={hostRef} className={`p1-map-host ${renderMode === 'fallback-svg' ? 'p1-map-host--hidden' : ''}`} />

      {renderMode === 'fallback-svg' ? (
        <svg className="p1-map-svg" viewBox="0 0 1000 720" aria-label="单线路感知洞察地图">
          <rect className="p1-map-svg__bg" x="0" y="0" width="1000" height="720" rx="28" />
          <g className="p1-map-svg__mesh">
            {Array.from({ length: 11 }, (_, index) => (
              <line key={`vertical-${index}`} x1={70 + index * 86} x2={70 + index * 86} y1="46" y2="674" />
            ))}
            {Array.from({ length: 7 }, (_, index) => (
              <line key={`horizontal-${index}`} x1="62" x2="938" y1={86 + index * 86} y2={86 + index * 86} />
            ))}
          </g>

          <polyline
            className="p1-map-svg__route-base"
            points={profile.routePoints.map((point) => projectPoint(point, bounds).join(',')).join(' ')}
          />

          {profile.trackSamples.map((sample, index) => {
            if (index === profile.trackSamples.length - 1) {
              return null
            }

            const nextSample = profile.trackSamples[index + 1]

            return (
              <line
                key={`sample-segment-${sample.id}`}
                className="p1-map-svg__route-line"
                x1={projectPoint(sample.position, bounds)[0]}
                y1={projectPoint(sample.position, bounds)[1]}
                x2={projectPoint(nextSample.position, bounds)[0]}
                y2={projectPoint(nextSample.position, bounds)[1]}
                stroke={getHeatColor(selectedMetric, sample.values[selectedMetric])}
              />
            )
          })}

          {profile.trackSamples.map((sample, index) => {
            const [x, y] = projectPoint(sample.position, bounds)

            return (
              <circle
                key={sample.id}
                className="p1-map-svg__sample"
                cx={x}
                cy={y}
                r={index % 4 === 0 ? 3.8 : 2.8}
                fill={getHeatColor(selectedMetric, sample.values[selectedMetric])}
              />
            )
          })}

          {profile.stations.map((station) => {
            const [x, y] = projectPoint(station.position, bounds)
            const labelOffset = getStationLabelOffset(profile.stations.findIndex((item) => item.id === station.id))

            return (
              <g key={station.id}>
                <circle className="p1-map-svg__station" cx={x} cy={y} r="5" />
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
            const [x, y] = projectPoint(marker.position, bounds)
            const isVisible = activeIssueTypes.includes(marker.type)
            const isSelected = marker.type === selectedIssue.type
            const issueColor = getIssueStateColor(marker.type, primaryIssueType, activeIssueTypes)

            return (
              <g
                key={marker.id}
                className={`p1-map-svg__issue-group ${isSelected ? 'p1-map-svg__issue-group--active' : ''} ${isVisible ? '' : 'p1-map-svg__issue-group--muted'}`.trim()}
                onClick={() => onSelectIssueType(marker.type)}
              >
                <circle className="p1-map-svg__issue-halo" cx={x} cy={y} r="13" fill={issueColor} />
                <circle
                  className="p1-map-svg__issue"
                  cx={x}
                  cy={y}
                  r={isSelected ? 7.5 : 6}
                  fill={issueColor}
                />
              </g>
            )
          })}
        </svg>
      ) : null}

      <div className="p1-map-overlay">
        <div className="p1-map-overlay__title">
          <span>线路感知洞察</span>
          <h2>{profile.lineName}</h2>
          <p>
            {selectedSlice.timeLabel} / {selectedSlice.train.trainNo}
          </p>
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
            <small>站点 / 小区</small>
            <b>{selectedIssue.siteLabel}</b>
          </div>
          <div>
            <small>是否闭环</small>
            <b className={selectedIssue.closed ? 'p1-map-focus__status--closed' : ''}>
              {selectedIssue.closed ? '已闭环' : '未闭环'}
            </b>
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
          <span className="p1-map-legend__title">热力</span>
          {[
            ['差', '#ff5a5f'],
            ['次差', '#f9c74f'],
            ['好', '#44df7e'],
            ['优', '#25e5ff'],
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
            <i style={{ background: '#ff5a5f' }} />
            主告警
          </span>
          <span className="p1-map-legend__item">
            <i style={{ background: '#f9c74f' }} />
            当前切片告警
          </span>
          <span className="p1-map-legend__item">
            <i style={{ background: '#25e5ff' }} />
            其他告警
          </span>
        </div>
      </div>
    </div>
  )
}
