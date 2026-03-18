import type {
  Coordinates,
  P1BaseStation,
  P1CorridorCell,
  P1IssueBinding,
  P1IssueMarker,
  P1IssueType,
  P1RouteProfile,
  P1SliceIssueOccurrence,
  P1TimelineSlice,
  P1TrackSample,
  P1TrainRunSummary,
} from '../types'

const routePoints: Coordinates[] = [
  [114.08, 35.97],
  [114.03, 35.74],
  [113.96, 35.46],
  [113.84, 35.12],
  [113.74, 34.86],
  [113.68, 34.78],
  [113.72, 34.48],
  [113.84, 34.17],
  [113.98, 33.82],
  [114.06, 33.48],
  [114.08, 33.07],
  [114.08, 32.64],
  [114.06, 32.22],
]

const issueAnchors = {
  spacing: 0.12,
  uplinkWeak: 0.31,
  coverageFault: 0.48,
  fiveGAbnormal: 0.64,
  tunnelIntermittent: 0.82,
} as const

const issueCatalog = {
  spacing: {
    id: 'issue-spacing',
    type: 'spacing' as const,
    label: '站间距离过大',
    countLabel: '10+',
    locationLabel: '鹤壁东 - 新乡东',
    siteLabel: '鹤壁东 - 新乡东 / 高铁190小区',
    closed: false,
    recommendation: '覆盖补强',
    detail: '区段内连续接续距离偏长，列车高速通过时在两个站点中间形成持续弱覆盖采样点。',
  },
  uplinkWeak: {
    id: 'issue-uplink',
    type: 'uplinkWeak' as const,
    label: '上行弱覆盖',
    countLabel: '5',
    locationLabel: '郑州东',
    siteLabel: '郑州东站段 / 高铁113小区',
    closed: false,
    recommendation: '参数优化',
    detail: '上行 SINR 持续偏低，列车经过时上行业务速率波动增大，短视频上传和文件发送最为敏感。',
  },
  coverageFault: {
    id: 'issue-fault',
    type: 'coverageFault' as const,
    label: '故障导致弱覆盖',
    countLabel: '2',
    locationLabel: '许昌东',
    siteLabel: '许昌东站段 / 高铁55-HSR小区',
    closed: false,
    recommendation: '故障处理',
    detail: '射频链路出现异常，导致局部覆盖空洞，最差点 RSRP 快速下探并伴随业务级体验下降。',
  },
  fiveGAbnormal: {
    id: 'issue-5g',
    type: 'fiveGAbnormal' as const,
    label: '5G驻留异常',
    countLabel: '2',
    locationLabel: '驻马店西',
    siteLabel: '驻马店西站段 / 高铁42-HSR小区',
    closed: true,
    recommendation: '优化调整',
    detail: '5G 驻留连续性不足，列车短时回落 4G，游戏和视频会议对该问题最为敏感。',
  },
  tunnelIntermittent: {
    id: 'issue-tunnel',
    type: 'tunnelIntermittent' as const,
    label: '隧道断续',
    countLabel: '1',
    locationLabel: '明港东',
    siteLabel: '明港东隧道段 / 后沟隧道口小区',
    closed: false,
    recommendation: '覆盖补强',
    detail: '隧道口至隧道中段存在断续覆盖，列车进入后下行吞吐率与网页首包时延出现同步波动。',
  },
}

const trainRuns: P1TrainRunSummary[] = [
  { trainNo: 'G79', trainType: '高铁', model: '动车组' },
  { trainNo: 'D37', trainType: '动车', model: '动车组' },
  { trainNo: 'G503', trainType: '高铁', model: '动车组' },
  { trainNo: 'G815', trainType: '高铁', model: '动车组' },
]

function metersToLng(meters: number, latitude: number) {
  const safeCos = Math.max(Math.cos((latitude * Math.PI) / 180), 0.2)
  return meters / (111320 * safeCos)
}

function metersToLat(meters: number) {
  return meters / 110540
}

function createOffset(point: Coordinates, eastMeters: number, northMeters: number): Coordinates {
  return [
    Number((point[0] + metersToLng(eastMeters, point[1])).toFixed(6)),
    Number((point[1] + metersToLat(northMeters)).toFixed(6)),
  ]
}

function toMetersVector(from: Coordinates, to: Coordinates) {
  return {
    east: (to[0] - from[0]) * 111320 * Math.cos((((from[1] + to[1]) / 2) * Math.PI) / 180),
    north: (to[1] - from[1]) * 110540,
  }
}

function normalizeVector(east: number, north: number) {
  const length = Math.hypot(east, north) || 1
  return {
    east: east / length,
    north: north / length,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function interpolatePath(points: Coordinates[], progress: number) {
  const safeProgress = Math.min(Math.max(progress, 0), 1)
  const maxIndex = points.length - 1

  if (maxIndex <= 0) {
    return points[0]
  }

  const scaled = safeProgress * maxIndex
  const index = Math.min(Math.floor(scaled), maxIndex - 1)
  const localProgress = scaled - index
  const current = points[index]
  const next = points[index + 1]

  return [
    Number((current[0] + (next[0] - current[0]) * localProgress).toFixed(6)),
    Number((current[1] + (next[1] - current[1]) * localProgress).toFixed(6)),
  ] as Coordinates
}

function calculateSegmentLength(from: Coordinates, to: Coordinates) {
  const east = (to[0] - from[0]) * 111320 * Math.cos((((from[1] + to[1]) / 2) * Math.PI) / 180)
  const north = (to[1] - from[1]) * 110540
  return Math.hypot(east, north)
}

function gaussian(progress: number, center: number, width: number) {
  return Math.exp(-Math.pow((progress - center) / width, 2))
}

function buildStation(progress: number, label: string, section: string): P1BaseStation {
  return {
    id: `station-${label}`,
    label,
    position: interpolatePath(routePoints, progress),
    section,
  }
}

function getSegmentLabel(sampleProgress: number) {
  if (sampleProgress < 0.22) return '北向A段'
  if (sampleProgress < 0.4) return '中北B段'
  if (sampleProgress < 0.58) return '中部C段'
  if (sampleProgress < 0.74) return '南向D段'
  return '南段E段'
}

function getMetricValues(sampleProgress: number, lateralPenalty = 0) {
  const spacingPenalty = gaussian(sampleProgress, issueAnchors.spacing, 0.018) * 0.46
  const uplinkPenalty = gaussian(sampleProgress, issueAnchors.uplinkWeak, 0.02) * 0.55
  const faultPenalty = gaussian(sampleProgress, issueAnchors.coverageFault, 0.015) * 0.82
  const abnormalPenalty = gaussian(sampleProgress, issueAnchors.fiveGAbnormal, 0.018) * 0.52
  const tunnelPenalty = gaussian(sampleProgress, issueAnchors.tunnelIntermittent, 0.017) * 0.62
  const totalPenalty =
    spacingPenalty + uplinkPenalty + faultPenalty + abnormalPenalty + tunnelPenalty + lateralPenalty

  return {
    rsrp: Number((-92.4 - totalPenalty * 7.2).toFixed(1)),
    sinr: Number((18.6 - totalPenalty * 3.6).toFixed(1)),
    uplinkAvg: Number((4.9 - (uplinkPenalty + faultPenalty + tunnelPenalty) * 1.18 - lateralPenalty * 0.22).toFixed(2)),
    downlinkAvg: Number((46.9 - (spacingPenalty + faultPenalty + abnormalPenalty + tunnelPenalty) * 5.1 - lateralPenalty * 0.26).toFixed(2)),
    serviceComposite: Number(
      clamp(
        97.2 -
          spacingPenalty * 16 -
          uplinkPenalty * 15 -
          faultPenalty * 22 -
          abnormalPenalty * 16 -
          tunnelPenalty * 18 -
          lateralPenalty * 4,
        58,
        99,
      ).toFixed(1),
    ),
  }
}

function buildCell(sampleProgress: number, laneOffset: -1 | 0 | 1): P1CorridorCell {
  const center = interpolatePath(routePoints, sampleProgress)
  const before = interpolatePath(routePoints, Math.max(sampleProgress - 0.018, 0))
  const after = interpolatePath(routePoints, Math.min(sampleProgress + 0.018, 1))
  const direction = normalizeVector(toMetersVector(before, after).east, toMetersVector(before, after).north)
  const perpendicular = { east: -direction.north, north: direction.east }

  const laneCenter = createOffset(center, perpendicular.east * laneOffset * 110, perpendicular.north * laneOffset * 110)
  const halfLength = 55
  const halfWidth = 50

  const cornerVectors = [
    { east: direction.east * halfLength + perpendicular.east * halfWidth, north: direction.north * halfLength + perpendicular.north * halfWidth },
    { east: direction.east * halfLength - perpendicular.east * halfWidth, north: direction.north * halfLength - perpendicular.north * halfWidth },
    { east: -direction.east * halfLength - perpendicular.east * halfWidth, north: -direction.north * halfLength - perpendicular.north * halfWidth },
    { east: -direction.east * halfLength + perpendicular.east * halfWidth, north: -direction.north * halfLength + perpendicular.north * halfWidth },
  ]

  const corners = cornerVectors.map((vector) => createOffset(laneCenter, vector.east, vector.north))

  return {
    id: `cell-${String(sampleProgress).replace('.', '-')}-${laneOffset}`,
    segmentLabel: getSegmentLabel(sampleProgress),
    position: laneCenter,
    corners,
    values: getMetricValues(sampleProgress, laneOffset === 0 ? 0 : 0.42),
  }
}

function buildCells() {
  const cells: P1CorridorCell[] = []
  for (let index = 0; index < 14; index += 1) {
    const progress = 0.06 + index * 0.065
    ;([-1, 0, 1] as const).forEach((laneOffset) => {
      cells.push(buildCell(progress, laneOffset))
    })
  }
  return cells
}

function buildTrackSamples(intervalMeters: number): P1TrackSample[] {
  const segmentLengths = routePoints.slice(0, -1).map((point, index) => calculateSegmentLength(point, routePoints[index + 1]))
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0)
  const samples: P1TrackSample[] = []

  let targetDistance = 0
  let segmentIndex = 0
  let traversed = 0

  while (targetDistance <= totalLength && segmentIndex < segmentLengths.length) {
    while (segmentIndex < segmentLengths.length - 1 && traversed + segmentLengths[segmentIndex] < targetDistance) {
      traversed += segmentLengths[segmentIndex]
      segmentIndex += 1
    }

    const segmentLength = segmentLengths[segmentIndex] || 1
    const localDistance = clamp(targetDistance - traversed, 0, segmentLength)
    const localProgress = localDistance / segmentLength
    const from = routePoints[segmentIndex]
    const to = routePoints[segmentIndex + 1]
    const point: Coordinates = [
      Number((from[0] + (to[0] - from[0]) * localProgress).toFixed(6)),
      Number((from[1] + (to[1] - from[1]) * localProgress).toFixed(6)),
    ]
    const progress = clamp(targetDistance / totalLength, 0, 1)

    samples.push({
      id: `sample-${targetDistance}`,
      segmentLabel: getSegmentLabel(progress),
      position: point,
      meterMark: Math.round(targetDistance),
      values: getMetricValues(progress),
    })

    targetDistance += intervalMeters
  }

  if (samples.at(-1)?.meterMark !== Math.round(totalLength)) {
    samples.push({
      id: `sample-${Math.round(totalLength)}`,
      segmentLabel: getSegmentLabel(1),
      position: routePoints[routePoints.length - 1],
      meterMark: Math.round(totalLength),
      values: getMetricValues(1),
    })
  }

  return samples
}

function buildIssueMarker(id: string, type: P1IssueType, label: string, progress: number, eastShift = 0): P1IssueMarker {
  const anchor = interpolatePath(routePoints, progress)
  return {
    id,
    type,
    label,
    position: createOffset(anchor, eastShift, 0),
    segmentLabel:
      type === 'spacing'
        ? '北向A3'
        : type === 'uplinkWeak'
          ? '中北B2'
          : type === 'coverageFault'
            ? '中部C1'
            : type === 'fiveGAbnormal'
              ? '联络D1'
              : '南段E4',
  }
}

function toneByNumber(value: number, thresholds: [number, number], reverse = false) {
  if (reverse) {
    if (value <= thresholds[0]) return 'accent' as const
    if (value <= thresholds[1]) return 'warning' as const
    return 'critical' as const
  }

  if (value >= thresholds[1]) return 'accent' as const
  if (value >= thresholds[0]) return 'warning' as const
  return 'critical' as const
}

function formatDecimal(value: number, digits = 1) {
  return value.toFixed(digits)
}

function formatTime(minuteOffset: number) {
  const startMinutes = 8 * 60
  const total = startMinutes + minuteOffset
  const hours = String(Math.floor(total / 60)).padStart(2, '0')
  const minutes = String(total % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

function buildSliceIssue(type: P1IssueType, train: P1TrainRunSummary, countOverride?: string): P1SliceIssueOccurrence {
  const issue = issueCatalog[type]
  return {
    ...issue,
    countLabel: countOverride ?? issue.countLabel,
    trainNo: train.trainNo,
    trainType: train.trainType,
  }
}

function buildMetrics(activeTypes: P1IssueType[]) {
  const severityScore = activeTypes.reduce((score, type) => {
    switch (type) {
      case 'spacing':
        return score + 0.28
      case 'uplinkWeak':
        return score + 0.36
      case 'coverageFault':
        return score + 0.58
      case 'fiveGAbnormal':
        return score + 0.34
      case 'tunnelIntermittent':
        return score + 0.46
      default:
        return score
    }
  }, 0)

  const issueCount = activeTypes.length
  const rsrp = -90.8 - severityScore * 5.8
  const sinr = 19.8 - severityScore * 3.2
  const samples = 14320 + issueCount * 20 + Math.round(severityScore * 8)
  const poorRatio = 2.4 + severityScore * 1.7
  const uplink = 4.95 - severityScore * 0.56
  const downlink = 46.8 - severityScore * 2.9
  const uplinkLowRatio = 2.8 + severityScore * 1.45
  const downlinkLowRatio = 1.3 + severityScore * 0.85
  const web = 23.4 - severityScore * 1.18
  const video = 22.8 - severityScore * 1.02
  const game = 41.5 + severityScore * 9.4
  const im = 7.9 - severityScore * 0.48

  return {
    signalSummary: [
      { label: 'RSRP', value: `${formatDecimal(rsrp)} dBm`, tone: toneByNumber(rsrp, [-103, -97], true) },
      { label: 'SINR', value: `${formatDecimal(sinr)} dB`, tone: toneByNumber(sinr, [10, 16]) },
      { label: '总采样点', value: String(samples), tone: 'accent' as const },
      { label: '质差占比', value: `${formatDecimal(poorRatio)}%`, tone: toneByNumber(poorRatio, [5.5, 9.5], true) },
    ],
    speedRows: [
      { label: '上行平均吞吐率', value: `${formatDecimal(Math.max(uplink, 3.9), 2)} Mbps`, tone: toneByNumber(uplink, [3.8, 4.6]) },
      { label: '下行平均吞吐率', value: `${formatDecimal(Math.max(downlink, 41.8), 2)} Mbps`, tone: toneByNumber(downlink, [42, 46]) },
      {
        label: '上行低速率采样点占比',
        value: `${formatDecimal(uplinkLowRatio, 2)}%`,
        tone: toneByNumber(uplinkLowRatio, [5.2, 8.5], true),
      },
      {
        label: '下行低速率采样点占比',
        value: `${formatDecimal(downlinkLowRatio, 2)}%`,
        tone: toneByNumber(downlinkLowRatio, [2.4, 4.3], true),
      },
    ],
    serviceRows: [
      { label: '网页浏览下行吞吐率', value: `${formatDecimal(Math.max(web, 20.8), 2)} Mbps`, tone: toneByNumber(web, [20.5, 23]) },
      { label: '短视频下行吞吐率', value: `${formatDecimal(Math.max(video, 19.8), 2)} Mbps`, tone: toneByNumber(video, [20, 22]) },
      { label: '游戏 RTT', value: `${formatDecimal(game, 2)} ms`, tone: toneByNumber(game, [55, 72], true) },
      { label: '即时通信下行吞吐量', value: `${formatDecimal(Math.max(im, 6.9), 2)} Mbps`, tone: toneByNumber(im, [6.8, 7.5]) },
    ],
  }
}

function getTrainByIndex(index: number) {
  if (index < 6) return trainRuns[0]
  if (index < 12) return trainRuns[1]
  if (index < 18) return trainRuns[2]
  return trainRuns[3]
}

function buildTimelineSlices(): P1TimelineSlice[] {
  const activeMap: Record<number, P1IssueType[]> = {
    0: ['spacing'],
    1: ['spacing'],
    2: ['spacing'],
    3: ['uplinkWeak'],
    4: ['uplinkWeak'],
    5: ['coverageFault'],
    6: ['coverageFault'],
    7: ['fiveGAbnormal'],
    8: ['fiveGAbnormal'],
    9: ['spacing'],
    10: ['spacing'],
    11: ['spacing'],
    12: ['tunnelIntermittent'],
    13: ['tunnelIntermittent'],
    14: ['tunnelIntermittent'],
    15: ['fiveGAbnormal'],
    16: ['fiveGAbnormal'],
    17: ['uplinkWeak'],
    18: ['coverageFault'],
    19: ['coverageFault'],
    20: ['tunnelIntermittent'],
    21: ['tunnelIntermittent'],
    22: ['tunnelIntermittent'],
    23: ['spacing'],
  }

  return Array.from({ length: 24 }, (_, index) => {
    const minuteOffset = index * 5
    const train = getTrainByIndex(index)
    const activeIssueTypes = activeMap[index] ?? ['spacing']
    const issueOccurrences = activeIssueTypes.map((type) =>
      buildSliceIssue(type, train, type === 'spacing' && index >= 18 ? '8' : undefined),
    )

    return {
      id: `slice-${String(index + 1).padStart(2, '0')}`,
      timeLabel: formatTime(minuteOffset),
      minuteOffset,
      train,
      activeIssueTypes,
      primaryIssueType: activeIssueTypes[0],
      metrics: buildMetrics(activeIssueTypes),
      issueOccurrences: issueOccurrences.sort((left, right) => Number.parseInt(right.countLabel, 10) - Number.parseInt(left.countLabel, 10)),
    }
  })
}

const timelineSlices = buildTimelineSlices()
const issueTypes: P1IssueType[] = ['spacing', 'uplinkWeak', 'coverageFault', 'fiveGAbnormal', 'tunnelIntermittent']

function buildIssueBindings(slices: P1TimelineSlice[]): P1IssueBinding[] {
  return issueTypes.map((issueType) => {
    const relatedSlices = slices.filter((slice) => slice.activeIssueTypes.includes(issueType))
    return {
      issueType,
      sliceIds: relatedSlices.map((slice) => slice.id),
      defaultSliceId: relatedSlices[0]?.id ?? slices[0].id,
    }
  })
}

const issueBindings = buildIssueBindings(timelineSlices)
const defaultIssueType: P1IssueType = 'spacing'
const defaultSliceId = issueBindings.find((binding) => binding.issueType === defaultIssueType)?.defaultSliceId ?? timelineSlices[0].id

export const p1RouteProfile: P1RouteProfile = {
  routeId: 'jingguang-hsr',
  lineName: '京广高速线',
  routePoints,
  stations: [
    buildStation(0.05, '安阳东', '北向A段'),
    buildStation(0.16, '鹤壁东', '北向A段'),
    buildStation(0.28, '新乡东', '中北B段'),
    buildStation(0.38, '郑州东', '中北B段'),
    buildStation(0.5, '许昌东', '中部C段'),
    buildStation(0.6, '漯河西', '南向D段'),
    buildStation(0.71, '驻马店西', '南向D段'),
    buildStation(0.83, '明港东', '南段E段'),
    buildStation(0.94, '信阳东', '南段E段'),
  ],
  corridorCells: buildCells(),
  trackSamples: buildTrackSamples(1000),
  metricOptions: [
    { key: 'rsrp', label: 'RSRP' },
    { key: 'sinr', label: 'SINR' },
    { key: 'uplinkAvg', label: '上行吞吐率' },
    { key: 'downlinkAvg', label: '下行吞吐率' },
    { key: 'serviceComposite', label: '业务感知' },
  ],
  signalSummary: timelineSlices.find((slice) => slice.id === defaultSliceId)?.metrics.signalSummary ?? timelineSlices[0].metrics.signalSummary,
  speedInsight: {
    title: '速率感知洞察',
    conclusion: '',
    rows: timelineSlices.find((slice) => slice.id === defaultSliceId)?.metrics.speedRows ?? timelineSlices[0].metrics.speedRows,
  },
  serviceInsight: {
    title: '业务感知洞察',
    conclusion: '',
    rows: timelineSlices.find((slice) => slice.id === defaultSliceId)?.metrics.serviceRows ?? timelineSlices[0].metrics.serviceRows,
  },
  issueList: Object.values(issueCatalog),
  issueMarkers: [
    buildIssueMarker('spacing-1', 'spacing', '站间距离过大', 0.14, -120),
    buildIssueMarker('uplink-1', 'uplinkWeak', '上行弱覆盖', 0.32, 120),
    buildIssueMarker('fault-1', 'coverageFault', '故障导致弱覆盖', 0.5, 180),
    buildIssueMarker('abnormal-1', 'fiveGAbnormal', '5G驻留异常', 0.65, -150),
    buildIssueMarker('tunnel-1', 'tunnelIntermittent', '隧道断续', 0.82, 150),
  ],
  defaultIssueType,
  issueBindings,
  defaultSliceId,
  timelineSlices,
}
