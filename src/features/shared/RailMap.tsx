import { useEffect, useRef, useState } from 'react'

import type { Coordinates, LineRiskSegment, RailRoute, TrainRun } from '../../types'
import { DataPanel } from './DataPanel'

interface RailMapProps {
  title: string
  subtitle: string
  routes: RailRoute[]
  trains: TrainRun[]
  segments: LineRiskSegment[]
  selectedRouteId?: string
  selectedTrainId?: string
  highlightSegmentIds?: string[]
  focusPoint?: Coordinates
}

type MapMode = 'loading' | 'ready' | 'fallback'

const fallbackKey = '608ef19e5d81f65bca761fa345a35c2f'

function getStationLabelPlacement(index: number) {
  const placements = [
    { dx: 12, dy: -10, anchor: 'left-center' },
    { dx: -12, dy: -10, anchor: 'right-center' },
    { dx: 12, dy: 16, anchor: 'left-center' },
    { dx: -12, dy: 16, anchor: 'right-center' },
  ]

  return placements[index % placements.length]
}

function loadAmapScript() {
  if (window.AMap) {
    return Promise.resolve()
  }

  if (window.__amapLoader) {
    return window.__amapLoader
  }

  const key = import.meta.env.VITE_AMAP_KEY ?? fallbackKey
  window.__amapLoader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('AMap failed to load'))
    document.head.appendChild(script)
  })

  return window.__amapLoader
}

function getBounds(routes: RailRoute[], trains: TrainRun[], segments: LineRiskSegment[], focusPoint?: Coordinates) {
  const points = [
    ...routes.flatMap((route) => route.routePoints),
    ...routes.flatMap((route) => route.stations.map((station) => station.position)),
    ...trains.map((train) => train.position),
    ...segments.map((segment) => segment.position),
  ]

  if (focusPoint) {
    points.push(focusPoint)
  }

  const lngValues = points.map((point) => point[0])
  const latValues = points.map((point) => point[1])

  return {
    minLng: Math.min(...lngValues),
    maxLng: Math.max(...lngValues),
    minLat: Math.min(...latValues),
    maxLat: Math.max(...latValues),
  }
}

function projectPoint(point: Coordinates, bounds: ReturnType<typeof getBounds>) {
  const padding = 72
  const width = 1120
  const height = 640
  const xRatio = (point[0] - bounds.minLng) / Math.max(bounds.maxLng - bounds.minLng, 0.01)
  const yRatio = (point[1] - bounds.minLat) / Math.max(bounds.maxLat - bounds.minLat, 0.01)

  return {
    x: padding + xRatio * (width - padding * 2),
    y: height - (padding + yRatio * (height - padding * 2)),
  }
}

export function RailMap({
  title,
  subtitle,
  routes,
  trains,
  segments,
  selectedRouteId,
  selectedTrainId,
  highlightSegmentIds = [],
  focusPoint,
}: RailMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<AMapMap | null>(null)
  const [mode, setMode] = useState<MapMode>('loading')

  useEffect(() => {
    let cancelled = false

    loadAmapScript()
      .then(() => {
        if (!cancelled) {
          setMode('ready')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMode('fallback')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (mode !== 'ready' || !containerRef.current || !window.AMap) {
      return
    }

    if (!mapRef.current) {
      mapRef.current = new window.AMap.Map(containerRef.current, {
        zoom: 4.8,
        center: [104.3, 35.8],
        mapStyle: 'amap://styles/darkblue',
        viewMode: '2D',
        dragEnable: true,
        zoomEnable: true,
      })
    }

    const map = mapRef.current
    const overlays: AMapOverlay[] = []

    map.clearMap()

    routes.forEach((route) => {
      const dimmed = selectedRouteId && route.id !== selectedRouteId
      overlays.push(
        new window.AMap!.Polyline({
          path: route.routePoints,
          strokeColor: route.color,
          strokeWeight: selectedRouteId === route.id ? 10 : 6,
          strokeOpacity: dimmed ? 0.28 : 0.9,
          showDir: true,
        }),
      )

      route.stations.forEach((station, stationIndex) => {
        const placement = getStationLabelPlacement(stationIndex)
        overlays.push(
          new window.AMap!.CircleMarker({
            center: station.position,
            radius: station.kind === 'hub' ? 8 : 5,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            fillColor: station.kind === 'hub' ? '#ffe07d' : '#95f3ff',
            fillOpacity: dimmed ? 0.25 : 0.95,
          }),
        )
        overlays.push(
          new window.AMap!.Text({
            text: station.name,
            position: station.position,
            anchor: placement.anchor,
            offset: new window.AMap!.Pixel(placement.dx, placement.dy),
            style: {
              background: 'transparent',
              border: 'none',
              padding: '0',
              color: dimmed ? 'rgba(224, 242, 255, 0.38)' : 'rgba(224, 242, 255, 0.78)',
              fontSize: '12px',
              fontWeight: '500',
              textShadow: '0 0 8px rgba(0, 0, 0, 0.56)',
            },
            zIndex: 21,
          }),
        )
      })
    })

    segments.forEach((segment) => {
      const highlighted = highlightSegmentIds.includes(segment.id)
      const fillColor =
        segment.severity === 'critical'
          ? '#ff6246'
          : segment.severity === 'warning'
            ? '#ffca58'
            : '#6be2ff'
      overlays.push(
        new window.AMap!.CircleMarker({
          center: segment.position,
          radius: highlighted ? 12 : 8,
          strokeColor: highlighted ? '#fff5d8' : '#07131d',
          strokeWeight: highlighted ? 3 : 2,
          fillColor,
          fillOpacity: highlighted ? 0.95 : 0.75,
        }),
      )
    })

    trains.forEach((train) => {
      const selected = train.id === selectedTrainId
      overlays.push(
        new window.AMap!.Marker({
          position: train.position,
          offset: new window.AMap!.Pixel(-38, -16),
          content: `<div style="padding:8px 12px;border-radius:999px;background:${
            selected ? '#f7501c' : '#0b2030'
          };color:#fff;border:1px solid rgba(255,255,255,0.2);font-size:12px;font-weight:700;box-shadow:0 16px 30px rgba(0,0,0,0.3);">${
            train.trainNo
          }</div>`,
        }),
      )
    })

    if (focusPoint) {
      overlays.push(
        new window.AMap!.CircleMarker({
          center: focusPoint,
          radius: 14,
          strokeColor: '#fff2ca',
          strokeWeight: 3,
          fillColor: '#fff2ca',
          fillOpacity: 0.35,
        }),
      )
    }

    map.add(overlays)
    map.setFitView(overlays, false, [120, 90, 120, 120], 7)

    return () => {
      map.clearMap()
    }
  }, [focusPoint, highlightSegmentIds, mode, routes, segments, selectedRouteId, selectedTrainId, trains])

  useEffect(() => {
    return () => {
      mapRef.current?.destroy()
      mapRef.current = null
    }
  }, [])

  const bounds = getBounds(routes, trains, segments, focusPoint)

  return (
    <DataPanel className="map-panel" title={title} subtitle={subtitle}>
      {mode === 'ready' ? (
        <div ref={containerRef} className="map-canvas" />
      ) : (
        <div className="map-fallback">
          <svg viewBox="0 0 1120 640" className="map-svg" role="img" aria-label={subtitle}>
            <rect x="0" y="0" width="1120" height="640" rx="28" className="map-svg__bg" />
            {routes.map((route) => {
              const dimmed = selectedRouteId && route.id !== selectedRouteId
              const polyline = route.routePoints
                .map((point) => {
                  const projected = projectPoint(point, bounds)
                  return `${projected.x},${projected.y}`
                })
                .join(' ')
              return (
                <polyline
                  key={route.id}
                  points={polyline}
                  className={`map-svg__route ${dimmed ? 'map-svg__route--dimmed' : ''}`}
                  stroke={route.color}
                />
              )
            })}
            {segments.map((segment) => {
              const projected = projectPoint(segment.position, bounds)
              const highlighted = highlightSegmentIds.includes(segment.id)
              return (
                <g key={segment.id}>
                  <circle
                    cx={projected.x}
                    cy={projected.y}
                    r={highlighted ? 14 : 10}
                    className={`map-svg__segment map-svg__segment--${segment.severity}`}
                  />
                  {highlighted ? (
                    <text x={projected.x + 18} y={projected.y - 16} className="map-svg__label">
                      {segment.issueType}
                    </text>
                  ) : null}
                </g>
              )
            })}
            {routes.flatMap((route) =>
              route.stations.map((station) => {
                const projected = projectPoint(station.position, bounds)
                return (
                  <g key={station.id}>
                    <circle
                      cx={projected.x}
                      cy={projected.y}
                      r={station.kind === 'hub' ? 8 : 6}
                      className="map-svg__station"
                    />
                    <text x={projected.x + 12} y={projected.y - 10} className="map-svg__label">
                      {station.name}
                    </text>
                  </g>
                )
              }),
            )}
            {trains.map((train) => {
              const projected = projectPoint(train.position, bounds)
              const selected = train.id === selectedTrainId
              return (
                <g key={train.id}>
                  <rect
                    x={projected.x - 28}
                    y={projected.y - 16}
                    width="56"
                    height="24"
                    rx="12"
                    className={`map-svg__train ${selected ? 'map-svg__train--selected' : ''}`}
                  />
                  <text x={projected.x} y={projected.y + 1} textAnchor="middle" className="map-svg__train-label">
                    {train.trainNo}
                  </text>
                </g>
              )
            })}
            {focusPoint
              ? (() => {
                  const projected = projectPoint(focusPoint, bounds)
                  return <circle cx={projected.x} cy={projected.y} r="26" className="map-svg__focus" />
                })()
              : null}
          </svg>
        </div>
      )}
    </DataPanel>
  )
}
