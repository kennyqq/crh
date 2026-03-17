import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..')

const sourcePath = path.join(workspaceRoot, 'public', 'hotosm_chn_railways_lines_geojson.geojson')
const targetPath = path.join(workspaceRoot, 'public', 'henan_highspeed_lines.geojson')

const bbox = {
  minLng: 110.5,
  maxLng: 116.7,
  minLat: 31.0,
  maxLat: 36.7,
}

const lineSpecs = [
  {
    id: 'jingguang-hsr',
    lineName: '京广高速线',
    aliases: ['京广高速线'],
    coverageRate: 64.8,
    avgRsrp: -106.8,
    avgSinr: 8.6,
    avgUplinkMbps: 1.8,
    avgDownlinkMbps: 28.4,
    badEventCount: 28,
  },
  {
    id: 'xulan-hsr',
    lineName: '徐兰高速线',
    aliases: ['徐兰高速线'],
    coverageRate: 82.4,
    avgRsrp: -98.7,
    avgSinr: 11.4,
    avgUplinkMbps: 2.5,
    avgDownlinkMbps: 34.8,
    badEventCount: 16,
  },
  {
    id: 'zhengyu-hsr',
    lineName: '郑渝高速线',
    aliases: ['郑渝高速线', '郑渝高铁'],
    coverageRate: 93.1,
    avgRsrp: -92.3,
    avgSinr: 14.8,
    avgUplinkMbps: 3.6,
    avgDownlinkMbps: 41.2,
    badEventCount: 7,
  },
  {
    id: 'jinzheng-hsr',
    lineName: '济郑高速线',
    aliases: ['济郑高速线', '济郑高铁'],
    coverageRate: 92.4,
    avgRsrp: -93.9,
    avgSinr: 14.1,
    avgUplinkMbps: 3.2,
    avgDownlinkMbps: 39.4,
    badEventCount: 6,
  },
  {
    id: 'zhengtai-hsr',
    lineName: '郑太高铁',
    aliases: ['郑太高铁'],
    coverageRate: 91.6,
    avgRsrp: -94.4,
    avgSinr: 13.9,
    avgUplinkMbps: 3.1,
    avgDownlinkMbps: 38.6,
    badEventCount: 5,
  },
  {
    id: 'zhengfu-hsr',
    lineName: '郑阜高铁',
    aliases: ['郑阜高铁'],
    coverageRate: 94.9,
    avgRsrp: -91.8,
    avgSinr: 15.2,
    avgUplinkMbps: 3.8,
    avgDownlinkMbps: 42.4,
    badEventCount: 4,
  },
  {
    id: 'zhengji-intercity',
    lineName: '郑机城际线',
    aliases: ['郑机城际线'],
    coverageRate: 96.8,
    avgRsrp: -90.4,
    avgSinr: 15.9,
    avgUplinkMbps: 4.0,
    avgDownlinkMbps: 44.8,
    badEventCount: 3,
  },
  {
    id: 'zhengkai-intercity',
    lineName: '郑开城际铁路',
    aliases: ['郑开城际铁路'],
    coverageRate: 95.2,
    avgRsrp: -91.2,
    avgSinr: 15.3,
    avgUplinkMbps: 3.9,
    avgDownlinkMbps: 43.1,
    badEventCount: 3,
  },
]

function getSignalLevel(coverageRate) {
  if (coverageRate < 70) {
    return 'risk'
  }

  if (coverageRate < 90) {
    return 'attention'
  }

  return 'good'
}

function getStatus(coverageRate) {
  if (coverageRate < 70) {
    return '盲区'
  }

  if (coverageRate < 90) {
    return '良好'
  }

  return '优秀'
}

function pickFeatureName(properties = {}) {
  return (
    properties['name:zh'] ||
    properties.name ||
    properties.official_name ||
    properties.alt_name ||
    ''
  ).trim()
}

function isPointInside([lng, lat]) {
  return lng >= bbox.minLng && lng <= bbox.maxLng && lat >= bbox.minLat && lat <= bbox.maxLat
}

function segmentTouchesBbox(points) {
  return points.some(isPointInside)
}

function simplifyLine(points) {
  if (points.length <= 16) {
    return points
  }

  const step = points.length > 120 ? 5 : points.length > 80 ? 4 : points.length > 40 ? 3 : 2
  const kept = points.filter((_, index) => index === 0 || index === points.length - 1 || index % step === 0)
  return kept.length >= 2 ? kept : points
}

function normalizeLines(feature) {
  if (!feature?.geometry) {
    return []
  }

  if (feature.geometry.type === 'LineString') {
    return [feature.geometry.coordinates]
  }

  if (feature.geometry.type === 'MultiLineString') {
    return feature.geometry.coordinates
  }

  return []
}

function buildOutputFeature(spec, coordinates, sourceSegmentCount) {
  return {
    type: 'Feature',
    geometry: {
      type: 'MultiLineString',
      coordinates,
    },
    properties: {
      id: spec.id,
      lineName: spec.lineName,
      coverageRate: spec.coverageRate,
      status: getStatus(spec.coverageRate),
      riskLevel: getSignalLevel(spec.coverageRate),
      avgRsrp: spec.avgRsrp,
      avgSinr: spec.avgSinr,
      avgUplinkMbps: spec.avgUplinkMbps,
      avgDownlinkMbps: spec.avgDownlinkMbps,
      badEventCount: spec.badEventCount,
      sourceSegmentCount,
    },
  }
}

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Source file not found: ${sourcePath}`)
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const groupedSegments = new Map(lineSpecs.map((spec) => [spec.id, { spec, coordinates: [] }]))

for (const feature of source.features ?? []) {
  const lineName = pickFeatureName(feature.properties)
  const spec = lineSpecs.find((item) => item.aliases.includes(lineName))

  if (!spec) {
    continue
  }

  const normalized = normalizeLines(feature)

  for (const line of normalized) {
    if (!Array.isArray(line) || line.length < 2 || !segmentTouchesBbox(line)) {
      continue
    }

    groupedSegments.get(spec.id)?.coordinates.push(simplifyLine(line))
  }
}

const output = {
  type: 'FeatureCollection',
  features: Array.from(groupedSegments.values())
    .filter((entry) => entry.coordinates.length > 0)
    .map((entry) => buildOutputFeature(entry.spec, entry.coordinates, entry.coordinates.length)),
}

fs.writeFileSync(targetPath, JSON.stringify(output, null, 2), 'utf8')

console.log(
  JSON.stringify(
    {
      targetPath,
      featureCount: output.features.length,
      lines: output.features.map((feature) => ({
        id: feature.properties.id,
        lineName: feature.properties.lineName,
        sourceSegmentCount: feature.properties.sourceSegmentCount,
      })),
    },
    null,
    2,
  ),
)
