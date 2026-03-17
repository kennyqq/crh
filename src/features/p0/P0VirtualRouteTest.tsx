import { useEffect, useMemo, useRef, useState } from 'react'

import { BorderBox12 } from '@jiaminghi/data-view-react'

import { loadAmapLoca } from './amapLocaLoader'
import {
  defaultRailCoverageGeoJson,
  fallbackMapBounds,
  fleetSignalLossProfiles,
  provinceLegendItems,
  provinceOverviewMetrics,
  provincePlaceLabels,
  provinceStationLabels,
  routeIssueSummaries,
  routeTrainInsights,
} from '../../mock/p0ProvinceData'
import type {
  Coordinates,
  DemoScene,
  MapRenderMode,
  RailCoverageFeature,
  RailCoverageGeoJson,
  RouteIssueSummary,
  RouteTrainInsight,
  SignalLevel,
} from '../../types'
import { DataPanel } from '../shared/DataPanel'

interface P0VirtualRouteTestProps {
  scene: DemoScene
  highlightMode: boolean
}

interface RankedRailCoverageFeature extends RailCoverageFeature {
  rank: number
}

interface MapInstances {
  map: any
  loca: any
  baseLayer: any
  infoWindow: any
  hitPolylines: any[]
  selectedOverlays: any[]
  AMap: any
}

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE
const REAL_GEOJSON_URL = `${import.meta.env.BASE_URL}henan_highspeed_lines.geojson`

const signalMeta: Record<SignalLevel, { label: string; className: string; color: string }> = {
  good: { label: '稳定', className: 'good', color: '#57da7d' },
  attention: { label: '预警', className: 'attention', color: '#ffca58' },
  risk: { label: '风险', className: 'risk', color: '#ff4d4f' },
}

function getSignalClassName(level: SignalLevel) {
  return `p0-signal-pill--${signalMeta[level].className}`
}

function getCoverageColor(coverageRate: number) {
  if (coverageRate > 90) {
    return '#00ff85'
  }

  if (coverageRate >= 70) {
    return '#faad14'
  }

  return '#ff4d4f'
}

function toLineSegments(feature: RailCoverageFeature) {
  if (feature.geometry.type === 'MultiLineString') {
    return feature.geometry.coordinates as Coordinates[][]
  }

  return [feature.geometry.coordinates as Coordinates[]]
}

function flattenCoordinates(feature: RailCoverageFeature) {
  return toLineSegments(feature).flat()
}

function buildTooltipContent(feature: RailCoverageFeature) {
  return `
    <div class="p0-map-tooltip">
      <strong>${feature.properties.lineName}</strong>
      <span>覆盖率 ${feature.properties.coverageRate.toFixed(1)}%</span>
    </div>
  `
}

function projectToViewBox([lng, lat]: Coordinates) {
  const width = 960
  const height = 760
  const paddingX = 72
  const paddingY = 72
  const x =
    paddingX +
    ((lng - fallbackMapBounds.minLng) / (fallbackMapBounds.maxLng - fallbackMapBounds.minLng)) *
      (width - paddingX * 2)
  const y =
    height -
    paddingY -
    ((lat - fallbackMapBounds.minLat) / (fallbackMapBounds.maxLat - fallbackMapBounds.minLat)) *
      (height - paddingY * 2)

  return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const
}

function polylineSegmentsFromFeature(feature: RailCoverageFeature) {
  return toLineSegments(feature)
    .map((segment) =>
      segment
        .map((point) => projectToViewBox(point))
        .map(([x, y]) => `${x},${y}`)
        .join(' '),
    )
    .filter((segment) => segment.length > 0)
}

function getFeatureCenter(feature: RailCoverageFeature) {
  const points = flattenCoordinates(feature)
  const [sumLng, sumLat] = points.reduce(
    (accumulator, [lng, lat]) => [accumulator[0] + lng, accumulator[1] + lat],
    [0, 0],
  )

  return projectToViewBox([sumLng / points.length, sumLat / points.length])
}

function getMapLabelPlacement(index: number) {
  const placements = [
    { dx: 10, dy: -12, anchor: 'left' as const, textAnchor: 'start' as const },
    { dx: -10, dy: -12, anchor: 'right' as const, textAnchor: 'end' as const },
    { dx: 10, dy: 18, anchor: 'left' as const, textAnchor: 'start' as const },
    { dx: -10, dy: 18, anchor: 'right' as const, textAnchor: 'end' as const },
  ]

  return placements[index % placements.length]
}

function getStationLabelPlacement(index: number) {
  const placements = [
    { dx: 8, dy: -10, anchor: 'left' as const, textAnchor: 'start' as const },
    { dx: -8, dy: -10, anchor: 'right' as const, textAnchor: 'end' as const },
    { dx: 8, dy: 14, anchor: 'left' as const, textAnchor: 'start' as const },
    { dx: -8, dy: 14, anchor: 'right' as const, textAnchor: 'end' as const },
  ]

  return placements[index % placements.length]
}

function getRiskSortOrder(level: SignalLevel) {
  if (level === 'risk') {
    return 0
  }

  if (level === 'attention') {
    return 1
  }

  return 2
}

function rankCoverageRows(features: RailCoverageFeature[]): RankedRailCoverageFeature[] {
  return [...features]
    .sort((left, right) => {
      const levelGap =
        getRiskSortOrder(left.properties.riskLevel) - getRiskSortOrder(right.properties.riskLevel)

      if (levelGap !== 0) {
        return levelGap
      }

      if (left.properties.badEventCount !== right.properties.badEventCount) {
        return right.properties.badEventCount - left.properties.badEventCount
      }

      return left.properties.coverageRate - right.properties.coverageRate
    })
    .map((feature, index) => ({
      ...feature,
      rank: index + 1,
    }))
}

function buildSelectedOverlays(AMap: any, feature: RailCoverageFeature) {
  return toLineSegments(feature).map(
    (path) =>
      new AMap.Polyline({
        path,
        strokeColor: getCoverageColor(feature.properties.coverageRate),
        strokeWeight: 8,
        strokeOpacity: 1,
        lineJoin: 'round',
        lineCap: 'round',
        zIndex: 24,
      }),
  )
}

function isRailCoverageGeoJson(data: unknown): data is RailCoverageGeoJson {
  if (!data || typeof data !== 'object') {
    return false
  }

  const candidate = data as RailCoverageGeoJson
  return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features) && candidate.features.length > 0
}

function normalizeRailCoverageGeoJson(data: RailCoverageGeoJson): RailCoverageGeoJson {
  return {
    type: 'FeatureCollection',
    features: data.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        coverageRate: Number(feature.properties.coverageRate),
        avgRsrp: Number(feature.properties.avgRsrp),
        avgSinr: Number(feature.properties.avgSinr),
        avgUplinkMbps: Number(feature.properties.avgUplinkMbps),
        avgDownlinkMbps: Number(feature.properties.avgDownlinkMbps),
        badEventCount: Number(feature.properties.badEventCount),
      },
    })),
  }
}

function SimpleFallbackMap({
  rows,
  selectedFeature,
  selectedFeatureId,
  onSelect,
}: {
  rows: RankedRailCoverageFeature[]
  selectedFeature: RailCoverageFeature
  selectedFeatureId: string
  onSelect: (routeId: string) => void
}) {
  const selectedCenter = getFeatureCenter(selectedFeature)

  return (
    <svg className="p0-map-svg" viewBox="0 0 960 760" preserveAspectRatio="none" role="img" aria-label="高铁线路态势图">
      <rect className="p0-map-svg__backdrop" x="0" y="0" width="960" height="760" rx="30" />
      <rect className="p0-map-svg__mesh" x="26" y="26" width="908" height="708" rx="24" />

      {[150, 310, 470, 630, 790].map((x) => (
        <line key={`grid-v-${x}`} className="p0-map-svg__gridline" x1={x} y1="60" x2={x} y2="700" />
      ))}
      {[140, 260, 380, 500, 620].map((y) => (
        <line key={`grid-h-${y}`} className="p0-map-svg__gridline" x1="60" y1={y} x2="900" y2={y} />
      ))}

      {rows.flatMap((feature) =>
        polylineSegmentsFromFeature(feature).map((points, index) => (
          <polyline key={`${feature.properties.id}-base-${index}`} className="p0-map-svg__route-base" points={points} />
        )),
      )}

      {rows.flatMap((feature) => {
        const isSelected = feature.properties.id === selectedFeatureId

        return polylineSegmentsFromFeature(feature).flatMap((points, index) => [
          <polyline
            key={`${feature.properties.id}-segment-${index}`}
            className={`p0-map-svg__segment ${isSelected ? 'p0-map-svg__segment--selected' : ''}`.trim()}
            style={{ stroke: getCoverageColor(feature.properties.coverageRate) }}
            points={points}
          />,
          <polyline
            key={`${feature.properties.id}-hitbox-${index}`}
            className="p0-map-svg__route-hitbox"
            points={points}
            onClick={() => onSelect(feature.properties.id)}
          />,
        ])
      })}

      {provincePlaceLabels.map((place, index) => {
        const [x, y] = projectToViewBox(place.position)
        const placement = getMapLabelPlacement(index)

        return (
          <text
            key={place.id}
            x={x + placement.dx}
            y={y + placement.dy}
            textAnchor={placement.textAnchor}
            className={`p0-map-svg__place-label p0-map-svg__place-label--${placement.anchor}`}
          >
            {place.name}
          </text>
        )
      })}

      {provinceStationLabels.map((station, index) => {
        const [x, y] = projectToViewBox(station.position)
        const placement = getStationLabelPlacement(index)

        return (
          <g key={station.id}>
            <circle cx={x} cy={y} r="3.6" className="p0-map-svg__station-dot" />
            <text
              x={x + placement.dx}
              y={y + placement.dy}
              textAnchor={placement.textAnchor}
              className={`p0-map-svg__station-label p0-map-svg__station-label--${placement.anchor}`}
            >
              {station.name}
            </text>
          </g>
        )
      })}

      <g className="p0-map-svg__route-label" transform={`translate(${selectedCenter[0]}, ${selectedCenter[1] - 18})`}>
        <rect x="-90" y="-22" width="180" height="40" rx="18" />
        <text x="0" y="2">
          {selectedFeature.properties.lineName}
        </text>
      </g>
    </svg>
  )
}

function OverviewBoard() {
  const [routeCount, trainMix, stationCount, boardCount] = provinceOverviewMetrics
  const trainValues = trainMix.value.split('/').map((item) => item.trim())

  return (
    <div className="p0-overview-grid">
      <article className="p0-overview-card p0-overview-card--accent">
        <span>{routeCount.label}</span>
        <strong>{routeCount.value}</strong>
      </article>

      <article className="p0-overview-card p0-overview-card--mix">
        <span>{trainMix.label}</span>
        <div className="p0-overview-card__mix">
          <div>
            <small>总列次</small>
            <strong>{trainValues[0]}</strong>
          </div>
          <div>
            <small>高铁</small>
            <strong>{trainValues[1]}</strong>
          </div>
          <div>
            <small>普客</small>
            <strong>{trainValues[2]}</strong>
          </div>
        </div>
      </article>

      <article className="p0-overview-card p0-overview-card--accent">
        <span>{stationCount.label}</span>
        <strong>{stationCount.value}</strong>
      </article>

      <article className="p0-overview-card p0-overview-card--warning">
        <span>{boardCount.label}</span>
        <strong>{boardCount.value}</strong>
      </article>
    </div>
  )
}

function RouteTrainBoard({
  selectedFeature,
  issueSummary,
  trains,
}: {
  selectedFeature: RailCoverageFeature
  issueSummary: RouteIssueSummary
  trains: RouteTrainInsight[]
}) {
  return (
    <section className="p0-stage__trains">
      <header className="p0-stage__trains-header">
        <strong>线路问题</strong>
        <span>{selectedFeature.properties.lineName}</span>
      </header>

      <div className={`p0-stage__issue p0-stage__issue--${issueSummary.severity}`}>
        <div>
          <small>主问题</small>
          <strong>{issueSummary.primaryIssue}</strong>
        </div>
        <div>
          <small>区段</small>
          <span>{issueSummary.segmentLabel}</span>
        </div>
        <div>
          <small>质差</small>
          <span>{issueSummary.badEventCount}</span>
        </div>
      </div>

      <div className="p0-stage__trains-list">
        {trains.map((train) => (
          <article key={train.id} className="p0-train-row">
            <div className="p0-train-row__main">
              <strong>{train.trainNo}</strong>
              <span>{train.trainType}</span>
              <span>{train.issue}</span>
            </div>
            <div className="p0-train-row__meta">
              <span>{train.riskScore}</span>
              <small>{train.coverageRate.toFixed(1)}%</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProvinceMapStage({
  geoJson,
  rows,
  selectedFeature,
  selectedRouteId,
  issueSummary,
  selectedTrains,
  onSelectRoute,
}: {
  geoJson: RailCoverageGeoJson
  rows: RankedRailCoverageFeature[]
  selectedFeature: RailCoverageFeature
  selectedRouteId: string
  issueSummary: RouteIssueSummary
  selectedTrains: RouteTrainInsight[]
  onSelectRoute: (routeId: string) => void
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const instancesRef = useRef<MapInstances | null>(null)
  const [renderMode, setRenderMode] = useState<MapRenderMode>('amap')

  useEffect(() => {
    let cancelled = false

    async function setupMap() {
      if (!AMAP_KEY || !mapContainerRef.current || rows.length === 0) {
        setRenderMode('fallback-svg')
        return
      }

      try {
        const { AMap, Loca } = await loadAmapLoca(AMAP_KEY, AMAP_SECURITY_CODE)

        if (cancelled || !mapContainerRef.current) {
          return
        }

        mapContainerRef.current.innerHTML = ''
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve())
        })

        const map = new AMap.Map(mapContainerRef.current, {
          viewMode: '2D',
          zoom: 7.3,
          center: [113.62, 34.76],
          pitch: 0,
          rotation: 0,
          mapStyle: 'amap://styles/dark',
          showLabel: false,
          features: ['bg', 'road', 'building'],
        })

        const loca = new Loca.Container({ map })
        const baseLayer = new Loca.LineLayer({
          loca,
          zIndex: 10,
          visible: true,
          opacity: 1,
          zooms: [4, 22],
        })

        baseLayer.setSource(new Loca.GeoJSONSource({ data: geoJson }))
        baseLayer.setStyle({
          lineWidth: 4,
          borderWidth: 1,
          opacity: 0.94,
          color: (_index: number, feature: RailCoverageFeature) =>
            getCoverageColor(feature.properties.coverageRate),
          borderColor: 'rgba(255,255,255,0.18)',
        })

        const infoWindow = new AMap.InfoWindow({
          isCustom: false,
          offset: new AMap.Pixel(0, -18),
          anchor: 'bottom-center',
        })

        const hitPolylines = rows.flatMap((feature) =>
          toLineSegments(feature).map((path) => {
            const polyline = new AMap.Polyline({
              path,
              strokeOpacity: 0.01,
              strokeWeight: 18,
              strokeColor: '#ffffff',
              zIndex: 30,
              extData: feature,
              cursor: 'pointer',
            })

            polyline.on('mouseover', (event: any) => {
              infoWindow.setContent(buildTooltipContent(feature))
              infoWindow.open(map, event.lnglat)
            })

            polyline.on('mousemove', (event: any) => {
              infoWindow.open(map, event.lnglat)
            })

            polyline.on('mouseout', () => {
              infoWindow.close()
            })

            polyline.on('click', () => {
              onSelectRoute(feature.properties.id)
            })

            map.add(polyline)
            return polyline
          }),
        )

        const selectedOverlays = buildSelectedOverlays(AMap, rows[0])
        selectedOverlays.forEach((overlay) => map.add(overlay))

        const labelOverlays = provincePlaceLabels.map((place, index) => {
          const placement = getMapLabelPlacement(index)
          return new AMap.Text({
            text: place.name,
            position: place.position,
            anchor: placement.anchor,
            offset: new AMap.Pixel(placement.dx, placement.dy),
            style: {
              background: 'transparent',
              border: 'none',
              padding: '0',
              color: 'rgba(225, 241, 255, 0.82)',
              fontSize: '12px',
              fontWeight: '500',
              textShadow: '0 0 10px rgba(0, 0, 0, 0.56)',
            },
            zIndex: 26,
          })
        })
        const stationOverlays = provinceStationLabels.flatMap((station, index) => {
          const placement = getStationLabelPlacement(index)
          return [
            new AMap.CircleMarker({
              center: station.position,
              radius: 4,
              strokeColor: '#fef6d3',
              strokeWeight: 1,
              fillColor: '#8de7ff',
              fillOpacity: 0.95,
              zIndex: 26,
            }),
            new AMap.Text({
              text: station.name,
              position: station.position,
              anchor: placement.anchor,
              offset: new AMap.Pixel(placement.dx, placement.dy),
              style: {
                background: 'transparent',
                border: 'none',
                padding: '0',
                color: 'rgba(195, 236, 255, 0.72)',
                fontSize: '11px',
                fontWeight: '500',
                textShadow: '0 0 8px rgba(0, 0, 0, 0.56)',
              },
              zIndex: 26,
            }),
          ]
        })
        ;[...labelOverlays, ...stationOverlays].forEach((overlay) => map.add(overlay))

        loca.add(baseLayer)

        instancesRef.current = {
          map,
          loca,
          baseLayer,
          infoWindow,
          hitPolylines,
          selectedOverlays: [...selectedOverlays, ...labelOverlays, ...stationOverlays],
          AMap,
        }

        requestAnimationFrame(() => {
          map.resize?.()
          map.setFitView?.(selectedOverlays, false, [70, 110, 70, 90], 9)
        })
        window.setTimeout(() => {
          map.resize?.()
          map.setFitView?.(selectedOverlays, false, [70, 110, 70, 90], 9)
        }, 120)

        setRenderMode('amap')
      } catch {
        setRenderMode('fallback-svg')
      }
    }

    setupMap()

    return () => {
      cancelled = true
      const instances = instancesRef.current

      if (!instances) {
        return
      }

      instances.infoWindow?.close?.()
      instances.hitPolylines.forEach((polyline) => {
        instances.map?.remove?.(polyline)
        polyline?.off?.()
      })
      instances.selectedOverlays.forEach((overlay) => instances.map?.remove?.(overlay))
      instances.baseLayer?.destroy?.()
      instances.loca?.destroy?.()
      instances.map?.destroy?.()
      instancesRef.current = null
    }
  }, [geoJson, onSelectRoute, rows])

  useEffect(() => {
    if (renderMode !== 'amap' || !instancesRef.current) {
      return
    }

    const instances = instancesRef.current
    instances.selectedOverlays.forEach((overlay) => instances.map?.remove?.(overlay))
    instances.selectedOverlays = buildSelectedOverlays(instances.AMap, selectedFeature)
    instances.selectedOverlays.forEach((overlay) => instances.map?.add?.(overlay))
    requestAnimationFrame(() => {
      instances.map?.resize?.()
      instances.map?.setFitView?.(instances.selectedOverlays, false, [70, 110, 70, 90], 9)
    })
  }, [renderMode, selectedFeature, selectedRouteId])

  return (
    <BorderBox12 className="p0-stage-shell" color={['#173859', '#4ecfff']} backgroundColor="rgba(6, 13, 22, 0.94)">
      <section className="p0-stage">
        <div className="p0-stage__overlay">
          <h2 className="p0-stage__overlay-title">高铁线路态势</h2>
          <div className="p0-stage__selection">
            <span className="p0-stage__selection-name">{selectedFeature.properties.lineName}</span>
            <span className={`p0-signal-pill ${getSignalClassName(selectedFeature.properties.riskLevel)}`}>
              {selectedFeature.properties.coverageRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {renderMode === 'amap' ? (
          <div ref={mapContainerRef} className="p0-map-host" aria-label="高德暗色线路态势图" />
        ) : (
          <SimpleFallbackMap
            rows={rows}
            selectedFeature={selectedFeature}
            selectedFeatureId={selectedRouteId}
            onSelect={onSelectRoute}
          />
        )}

        <div className="p0-stage__legend">
          {provinceLegendItems.map((item) => (
            <div key={item.label} className="p0-stage__legend-item">
              <i className={`p0-legend-dot p0-legend-dot--${item.signalLevel}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <RouteTrainBoard selectedFeature={selectedFeature} issueSummary={issueSummary} trains={selectedTrains} />
      </section>
    </BorderBox12>
  )
}

function RouteRankingTable({
  rows,
  selectedRouteId,
  onSelectRoute,
}: {
  rows: RankedRailCoverageFeature[]
  selectedRouteId: string
  onSelectRoute: (routeId: string) => void
}) {
  return (
    <div className="p0-ranking-table">
      <div className="p0-ranking-table__header">
        <span>线路</span>
        <span>覆盖率</span>
        <span>RSRP</span>
        <span>SINR</span>
        <span>上行</span>
        <span>下行</span>
        <span>质差</span>
        <span>等级</span>
      </div>

      <div className="p0-ranking-table__body">
        {rows.map((feature) => {
          const isActive = feature.properties.id === selectedRouteId

          return (
            <button
              key={feature.properties.id}
              type="button"
              className={`p0-ranking-row ${isActive ? 'p0-ranking-row--active' : ''}`.trim()}
              onClick={() => onSelectRoute(feature.properties.id)}
            >
              <span className="p0-ranking-cell p0-ranking-cell--name">
                <em>{String(feature.rank).padStart(2, '0')}</em>
                <strong>{feature.properties.lineName}</strong>
              </span>
              <span className="p0-ranking-cell">{feature.properties.coverageRate.toFixed(1)}%</span>
              <span className="p0-ranking-cell">{feature.properties.avgRsrp.toFixed(1)}</span>
              <span className="p0-ranking-cell">{feature.properties.avgSinr.toFixed(1)}</span>
              <span className="p0-ranking-cell">{feature.properties.avgUplinkMbps.toFixed(1)}</span>
              <span className="p0-ranking-cell">{feature.properties.avgDownlinkMbps.toFixed(1)}</span>
              <span className="p0-ranking-cell p0-ranking-cell--bad">{feature.properties.badEventCount}</span>
              <span className="p0-ranking-status">
                <i className={`p0-ranking-status__dot p0-ranking-status__dot--${feature.properties.riskLevel}`} />
                {signalMeta[feature.properties.riskLevel].label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FleetLossComparison() {
  return (
    <div className="p0-comparison-grid">
      {fleetSignalLossProfiles.map((profile) => (
        <article
          key={profile.typeLabel}
          className={`p0-comparison-card ${profile.typeLabel === '动车组' ? 'p0-comparison-card--accent' : ''}`.trim()}
        >
          <span>{profile.typeLabel}</span>
          <strong>{profile.rsrp.toFixed(1)} dBm</strong>
          <small>SINR {profile.sinr.toFixed(1)} dB</small>
        </article>
      ))}
    </div>
  )
}

export function P0VirtualRouteTest({ scene }: P0VirtualRouteTestProps) {
  const [mapGeoJson, setMapGeoJson] = useState<RailCoverageGeoJson>(defaultRailCoverageGeoJson)
  const [selectedRouteId, setSelectedRouteId] = useState(defaultRailCoverageGeoJson.features[0]?.properties.id ?? '')

  useEffect(() => {
    let cancelled = false

    async function loadRealGeoJson() {
      try {
        const response = await fetch(REAL_GEOJSON_URL, { cache: 'force-cache' })

        if (!response.ok) {
          return
        }

        const data = await response.json()

        if (!cancelled && isRailCoverageGeoJson(data)) {
          setMapGeoJson(normalizeRailCoverageGeoJson(data))
        }
      } catch {
        // Keep the built-in fallback dataset when the real subset cannot be loaded.
      }
    }

    loadRealGeoJson()

    return () => {
      cancelled = true
    }
  }, [])

  const coverageRows = useMemo(() => rankCoverageRows(mapGeoJson.features), [mapGeoJson])

  useEffect(() => {
    if (coverageRows.length === 0) {
      return
    }

    const current = coverageRows.find((feature) => feature.properties.id === selectedRouteId)

    if (!current) {
      setSelectedRouteId(coverageRows[0].properties.id)
    }
  }, [coverageRows, selectedRouteId])

  useEffect(() => {
    if (!scene.focusRouteId) {
      return
    }

    const target = coverageRows.find((feature) => feature.properties.id === scene.focusRouteId)

    if (target) {
      setSelectedRouteId(target.properties.id)
    }
  }, [coverageRows, scene.focusRouteId])

  const selectedFeature = useMemo(
    () => coverageRows.find((feature) => feature.properties.id === selectedRouteId) ?? coverageRows[0],
    [coverageRows, selectedRouteId],
  )

  const selectedTrainInsights = useMemo(
    () =>
      routeTrainInsights
        .filter((item) => item.routeId === selectedRouteId)
        .sort((left, right) => right.riskScore - left.riskScore)
        .slice(0, 4),
    [selectedRouteId],
  )

  const selectedIssueSummary = useMemo(
    () =>
      routeIssueSummaries.find((item) => item.routeId === selectedRouteId) ?? {
        routeId: selectedRouteId,
        primaryIssue: '无明显异常',
        segmentLabel: '当前区段',
        badEventCount: 0,
        worstTrain: '--',
        severity: 'good' as const,
      },
    [selectedRouteId],
  )

  if (!selectedFeature) {
    return null
  }

  return (
    <div className="screen-page">
      <div className="p0-dashboard">
        <ProvinceMapStage
          geoJson={mapGeoJson}
          rows={coverageRows}
          selectedFeature={selectedFeature}
          selectedRouteId={selectedRouteId}
          issueSummary={selectedIssueSummary}
          selectedTrains={selectedTrainInsights}
          onSelectRoute={setSelectedRouteId}
        />

        <section className="p0-sidebar">
          <DataPanel title="运行总览">
            <OverviewBoard />
          </DataPanel>

          <DataPanel
            title="线路排序"
            aside={
              <span className={`p0-signal-pill ${getSignalClassName(selectedFeature.properties.riskLevel)}`}>
                {selectedFeature.properties.lineName}
              </span>
            }
          >
            <RouteRankingTable rows={coverageRows} selectedRouteId={selectedRouteId} onSelectRoute={setSelectedRouteId} />
          </DataPanel>

          <DataPanel title="车型对比">
            <FleetLossComparison />
          </DataPanel>
        </section>
      </div>
    </div>
  )
}
