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
  [114.1, 35.95],
  [114.05, 35.72],
  [113.98, 35.44],
  [113.86, 35.1],
  [113.74, 34.84],
  [113.66, 34.76],
  [113.71, 34.48],
  [113.83, 34.18],
  [113.97, 33.82],
  [114.05, 33.48],
  [114.08, 33.06],
  [114.08, 32.64],
  [114.06, 32.2],
]

const issueAnchors = {
  spacing: 0.12,
  uplinkWeak: 0.31,
  coverageFault: 0.48,
  fiveGAbnormal: 0.63,
  tunnelIntermittent: 0.81,
} as const

const issueCatalog = {
  spacing: {
    id: 'issue-spacing',
    type: 'spacing' as const,
    label: '站间距离过大',
    countLabel: '10+',
    locationLabel: '北向A3',
    siteLabel: '高铁190小区',
    closed: false,
    recommendation: '覆盖补强',
    detail:
      '区段内连续接续距离偏长，列车高速通过时在两个站点中间形成持续弱覆盖采样点。',
  },
  uplinkWeak: {
    id: 'issue-uplink',
    type: 'uplinkWeak' as const,
    label: '上行弱覆盖',
    countLabel: '5',
    locationLabel: '中北B2',
    siteLabel: '高铁113小区',
    closed: false,
    recommendation: '参数优化',
    detail:
      '上行 SINR 持续偏低，列车通过时上传业务速率明显下滑，上行业务体验受影响最明显。',
  },
  coverageFault: {
    id: 'issue-fault',
    type: 'coverageFault' as const,
    label: '故障导致弱覆盖',
    countLabel: '2',
    locationLabel: '中部C1',
    siteLabel: '高铁55-HSR小区',
    closed: false,
    recommendation: '故障处理',
    detail:
      '射频链路异常导致局部覆盖空洞，最差点 RSRP 快速跌落并伴随业务级体验恶化。',
  },
  fiveGAbnormal: {
    id: 'issue-5g',
    type: 'fiveGAbnormal' as const,
    label: '5G驻留异常',
    countLabel: '2',
    locationLabel: '联络D1',
    siteLabel: '高铁42-HSR小区',
    closed: true,
    recommendation: '优化调整',
    detail:
      '5G 驻留连续性不足，列车短时回落 4G，游戏与视频通话场景对该问题最敏感。',
  },
  tunnelIntermittent: {
    id: 'issue-tunnel',
    type: 'tunnelIntermittent' as const,
    label: '隧道断续',
    countLabel: '1',
    locationLabel: '南段E4',
    siteLabel: '后沟隧道口小区',
    closed: false,
    recommendation: '覆盖补强',
    detail:
      '隧道口至隧道中段存在断续覆盖，列车进入后下行吞吐率与网页首包时延出现同步波动。',
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

function buildStation(progress: number, label: string, section: string): P1BaseStation {
  return {
    id: `station-${label}`,
    label,
    position: interpolatePath(routePoints, progress),
    section,
  }
}

function gaussian(progress: number, center: number, width: number) {
  return Math.exp(-Math.pow((progress - center) / width, 2))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function calculateSegmentLength(from: Coordinates, to: Coordinates) {
  const east = (to[0] - from[0]) * 111320 * Math.cos((((from[1] + to[1]) / 2) * Math.PI) / 180)
  const north = (to[1] - from[1]) * 110540
  return Math.hypot(east, north)
}

function getMetricValues(sampleProgress: number, lateralPenalty = 0) {
  const spacingPenalty = gaussian(sampleProgress, issueAnchors.spacing, 0.02) * 0.82
  const uplinkPenalty = gaussian(sampleProgress, issueAnchors.uplinkWeak, 0.022) * 0.95
  const faultPenalty = gaussian(sampleProgress, issueAnchors.coverageFault, 0.018) * 1.35
  const abnormalPenalty = gaussian(sampleProgress, issueAnchors.fiveGAbnormal, 0.02) * 0.92
  const tunnelPenalty = gaussian(sampleProgress, issueAnchors.tunnelIntermittent, 0.018) * 1.18
  const totalPenalty =
      spacingPenalty + uplinkPenalty + faultPenalty + abnormalPenalty + tunnelPenalty + lateralPenalty

  return {
    rsrp: Number((-91.2 - totalPenalty * 9.4).toFixed(1)),
    sinr: Number((18.9 - totalPenalty * 5.1).toFixed(1)),
    uplinkAvg: Number(
      (4.9 - (uplinkPenalty + faultPenalty + tunnelPenalty) * 1.45 - lateralPenalty * 0.28).toFixed(2),
    ),
    downlinkAvg: Number(
      (45.6 - (spacingPenalty + faultPenalty + abnormalPenalty + tunnelPenalty) * 6.6 - lateralPenalty * 0.38).toFixed(2),
    ),
    serviceComposite: Number(
      clamp(
        97.5 -
          spacingPenalty * 20 -
          uplinkPenalty * 18 -
          faultPenalty * 28 -
          abnormalPenalty * 22 -
          tunnelPenalty * 24 -
          lateralPenalty * 4,
        36,
        99,
      ).toFixed(1),
    ),
  }
}

function getSegmentLabel(sampleProgress: number) {
  if (sampleProgress < 0.22) return '北向A段'
  if (sampleProgress < 0.4) return '中北B段'
  if (sampleProgress < 0.58) return '中部C段'
  if (sampleProgress < 0.74) return '南向D段'
  return '南段E段'
}

function buildCell(sampleProgress: number, laneOffset: -1 | 0 | 1): P1CorridorCell {
  const center = interpolatePath(routePoints, sampleProgress)
  const before = interpolatePath(routePoints, Math.max(sampleProgress - 0.018, 0))
  const after = interpolatePath(routePoints, Math.min(sampleProgress + 0.018, 1))
  const direction = normalizeVector(
    toMetersVector(before, after).east,
    toMetersVector(before, after).north,
  )
  const perpendicular = {
    east: -direction.north,
    north: direction.east,
  }

  const laneCenterEast = perpendicular.east * laneOffset * 110
  const laneCenterNorth = perpendicular.north * laneOffset * 110
  const laneCenter = createOffset(center, laneCenterEast, laneCenterNorth)

  const halfLength = 55
  const halfWidth = 50

  const cornerVectors = [
    {
      east: direction.east * halfLength + perpendicular.east * halfWidth,
      north: direction.north * halfLength + perpendicular.north * halfWidth,
    },
    {
      east: direction.east * halfLength - perpendicular.east * halfWidth,
      north: direction.north * halfLength - perpendicular.north * halfWidth,
    },
    {
      east: -direction.east * halfLength - perpendicular.east * halfWidth,
      north: -direction.north * halfLength - perpendicular.north * halfWidth,
    },
    {
      east: -direction.east * halfLength + perpendicular.east * halfWidth,
      north: -direction.north * halfLength + perpendicular.north * halfWidth,
    },
  ]

  const corners = cornerVectors.map((vector) => createOffset(laneCenter, vector.east, vector.north))
  const values = getMetricValues(sampleProgress, laneOffset === 0 ? 0 : 0.55)

  return {
    id: `cell-${String(sampleProgress).replace('.', '-')}-${laneOffset}`,
    segmentLabel: getSegmentLabel(sampleProgress),
    position: laneCenter,
    corners,
    values,
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
  const segmentLengths = routePoints
    .slice(0, -1)
    .map((point, index) => calculateSegmentLength(point, routePoints[index + 1]))
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

function buildIssueMarker(
  id: string,
  type: P1IssueMarker['type'],
  label: string,
  progress: number,
  eastShift = 0,
): P1IssueMarker {
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
        return score + 0.55
      case 'uplinkWeak':
        return score + 0.68
      case 'coverageFault':
        return score + 1.08
      case 'fiveGAbnormal':
        return score + 0.74
      case 'tunnelIntermittent':
        return score + 0.9
      default:
        return score
    }
  }, 0)

  const issueCount = activeTypes.length
  const rsrp = -92.4 - severityScore * 2.35
  const sinr = 18.6 - severityScore * 1.35
  const samples = 14320 + issueCount * 28 + Math.round(severityScore * 14)
  const poorRatio = 2.6 + severityScore * 1.8
  const uplink = 4.86 - severityScore * 0.56
  const downlink = 47.4 - severityScore * 2.85
  const uplinkLowRatio = 3.4 + severityScore * 1.55
  const downlinkLowRatio = 1.7 + severityScore * 0.82
  const web = 23.6 - severityScore * 1.32
  const video = 22.8 - severityScore * 1.12
  const game = 43 + severityScore * 7.2
  const im = 7.9 - severityScore * 0.5

  return {
    signalSummary: [
      { label: 'RSRP', value: `${formatDecimal(rsrp)} dBm`, tone: toneByNumber(rsrp, [-103, -97], true) },
      { label: 'SINR', value: `${formatDecimal(sinr)} dB`, tone: toneByNumber(sinr, [10, 16]) },
      { label: '总采样点', value: String(samples), tone: 'accent' as const },
      { label: '质差占比', value: `${formatDecimal(poorRatio)}%`, tone: toneByNumber(poorRatio, [5.5, 9.5], true) },
    ],
    speedRows: [
      { label: '上行平均吞吐率', value: `${formatDecimal(Math.max(uplink, 3.2), 2)} Mbps`, tone: toneByNumber(uplink, [3.6, 4.5]) },
      { label: '下行平均吞吐率', value: `${formatDecimal(Math.max(downlink, 39), 2)} Mbps`, tone: toneByNumber(downlink, [41, 46]) },
      {
        label: '上行低速率采样点占比',
        value: `${formatDecimal(uplinkLowRatio, 2)}%`,
        tone: toneByNumber(uplinkLowRatio, [5.5, 9], true),
      },
      {
        label: '下行低速率采样点占比',
        value: `${formatDecimal(downlinkLowRatio, 2)}%`,
        tone: toneByNumber(downlinkLowRatio, [2.5, 4.6], true),
      },
    ],
    serviceRows: [
      { label: '网页浏览下行吞吐率', value: `${formatDecimal(Math.max(web, 18.5), 2)} Mbps`, tone: toneByNumber(web, [19, 22.5]) },
      { label: '短视频下行吞吐率', value: `${formatDecimal(Math.max(video, 17.6), 2)} Mbps`, tone: toneByNumber(video, [18.5, 21.8]) },
      { label: '游戏 RTT', value: `${formatDecimal(game, 2)} ms`, tone: toneByNumber(game, [55, 72], true) },
      { label: '即时通信下行吞吐量', value: `${formatDecimal(Math.max(im, 6.1), 2)} Mbps`, tone: toneByNumber(im, [6.5, 7.4]) },
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
  const slices: P1TimelineSlice[] = []

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

  for (let index = 0; index < 24; index += 1) {
    const minuteOffset = index * 5
    const train = getTrainByIndex(index)
    const activeIssueTypes = activeMap[index] ?? ['spacing']
    const issueOccurrences = activeIssueTypes.map((type) =>
      buildSliceIssue(
        type,
        train,
        type === 'spacing' && index >= 18 ? '8' : undefined,
      ),
    )

    slices.push({
      id: `slice-${String(index + 1).padStart(2, '0')}`,
      timeLabel: formatTime(minuteOffset),
      minuteOffset,
      train,
      activeIssueTypes,
      primaryIssueType: activeIssueTypes[0],
      metrics: buildMetrics(activeIssueTypes),
      issueOccurrences: issueOccurrences.sort((left, right) => Number.parseInt(right.countLabel, 10) - Number.parseInt(left.countLabel, 10)),
    })
  }

  return slices
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
const defaultSliceId =
  issueBindings.find((binding) => binding.issueType === defaultIssueType)?.defaultSliceId ?? timelineSlices[0].id

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
