import type {
  Coordinates,
  FleetSignalLossProfile,
  OverviewMetric,
  RailCoverageFeature,
  RailCoverageGeoJson,
  RailCoverageProperties,
  RouteIssueSummary,
  RouteTrainInsight,
  SignalLevel,
} from '../types'

function createLineFeature(
  properties: RailCoverageProperties,
  coordinates: Coordinates[] | Coordinates[][],
): RailCoverageFeature {
  return {
    type: 'Feature',
    geometry: Array.isArray(coordinates[0][0])
      ? {
          type: 'MultiLineString',
          coordinates: coordinates as Coordinates[][],
        }
      : {
          type: 'LineString',
          coordinates: coordinates as Coordinates[],
        },
    properties,
  }
}

function getSignalLevel(coverageRate: number): SignalLevel {
  if (coverageRate < 70) {
    return 'risk'
  }

  if (coverageRate < 90) {
    return 'attention'
  }

  return 'good'
}

function getStatus(coverageRate: number): RailCoverageProperties['status'] {
  if (coverageRate < 70) {
    return '盲区'
  }

  if (coverageRate < 90) {
    return '良好'
  }

  return '优秀'
}

function routeProperties(
  id: string,
  lineName: string,
  coverageRate: number,
  avgRsrp: number,
  avgSinr: number,
  avgUplinkMbps: number,
  avgDownlinkMbps: number,
  badEventCount: number,
): RailCoverageProperties {
  return {
    id,
    lineName,
    coverageRate,
    status: getStatus(coverageRate),
    riskLevel: getSignalLevel(coverageRate),
    avgRsrp,
    avgSinr,
    avgUplinkMbps,
    avgDownlinkMbps,
    badEventCount,
  }
}

export const provinceOverviewMetrics: OverviewMetric[] = [
  { label: '监测线路', value: '8 条', tone: 'accent', note: '' },
  { label: '列次监测', value: '286 / 198 / 88', tone: 'accent', note: '' },
  { label: '覆盖基站', value: '1080 站', tone: 'accent', note: '' },
  { label: '智能板卡', value: '312 块', tone: 'warning', note: '' },
]

export const defaultRailCoverageGeoJson: RailCoverageGeoJson = {
  type: 'FeatureCollection',
  features: [
    createLineFeature(
      routeProperties('jingguang-hsr', '京广高速线', 64.8, -106.8, 8.6, 1.8, 28.4, 28),
      [
        [114.14, 35.91],
        [113.86, 35.32],
        [113.64, 34.76],
        [113.98, 33.58],
        [114.06, 32.13],
      ],
    ),
    createLineFeature(
      routeProperties('xulan-hsr', '徐兰高速线', 82.4, -98.7, 11.4, 2.5, 34.8, 16),
      [
        [111.93, 34.78],
        [112.45, 34.69],
        [113.28, 34.76],
        [113.64, 34.76],
        [114.73, 34.76],
        [115.48, 34.42],
      ],
    ),
    createLineFeature(
      routeProperties('zhengyu-hsr', '郑渝高速线', 93.1, -92.3, 14.8, 3.6, 41.2, 7),
      [
        [113.64, 34.76],
        [113.28, 34.21],
        [112.93, 33.71],
        [112.42, 33.04],
      ],
    ),
    createLineFeature(
      routeProperties('jinzheng-hsr', '济郑高速线', 92.4, -93.9, 14.1, 3.2, 39.4, 6),
      [
        [113.64, 34.76],
        [114.15, 35.06],
        [114.74, 35.42],
        [115.16, 35.67],
      ],
    ),
    createLineFeature(
      routeProperties('zhengtai-hsr', '郑太高铁', 91.6, -94.4, 13.9, 3.1, 38.6, 5),
      [
        [113.64, 34.76],
        [113.21, 35.08],
        [112.83, 35.21],
        [112.47, 35.39],
      ],
    ),
    createLineFeature(
      routeProperties('zhengfu-hsr', '郑阜高铁', 94.9, -91.8, 15.2, 3.8, 42.4, 4),
      [
        [113.64, 34.76],
        [114.18, 34.16],
        [114.72, 33.61],
        [115.82, 32.90],
      ],
    ),
    createLineFeature(
      routeProperties('zhengji-intercity', '郑机城际线', 96.8, -90.4, 15.9, 4.0, 44.8, 3),
      [
        [113.64, 34.76],
        [113.78, 34.69],
        [113.84, 34.56],
        [113.84, 34.53],
      ],
    ),
    createLineFeature(
      routeProperties('zhengkai-intercity', '郑开城际铁路', 95.2, -91.2, 15.3, 3.9, 43.1, 3),
      [
        [113.64, 34.76],
        [114.15, 34.80],
        [114.61, 34.80],
      ],
    ),
  ],
}

export const fallbackMapBounds = {
  minLng: 110.8,
  maxLng: 116.2,
  minLat: 31.5,
  maxLat: 36.4,
}

export const provincePlaceLabels: Array<{
  id: string
  name: string
  position: Coordinates
}> = [
  { id: 'anyang', name: '安阳', position: [114.39, 36.10] },
  { id: 'hebi', name: '鹤壁', position: [114.30, 35.75] },
  { id: 'xinxiang', name: '新乡', position: [113.90, 35.31] },
  { id: 'zhengzhou', name: '郑州', position: [113.62, 34.76] },
  { id: 'kaifeng', name: '开封', position: [114.31, 34.80] },
  { id: 'luoyang', name: '洛阳', position: [112.44, 34.66] },
  { id: 'xuchang', name: '许昌', position: [113.85, 34.03] },
  { id: 'luohe', name: '漯河', position: [114.02, 33.58] },
  { id: 'zhumadian', name: '驻马店', position: [114.03, 32.98] },
  { id: 'xinyang', name: '信阳', position: [114.06, 32.13] },
]

export const provinceStationLabels: Array<{
  id: string
  name: string
  position: Coordinates
}> = [
  { id: 'anyang-east', name: '安阳东', position: [114.41, 36.12] },
  { id: 'hebi-east', name: '鹤壁东', position: [114.29, 35.74] },
  { id: 'xinxiang-east', name: '新乡东', position: [113.94, 35.30] },
  { id: 'zhengzhou-east', name: '郑州东', position: [113.78, 34.75] },
  { id: 'xuchang-east', name: '许昌东', position: [113.85, 34.02] },
  { id: 'luohe-west', name: '漯河西', position: [114.02, 33.57] },
  { id: 'zhumadian-west', name: '驻马店西', position: [114.01, 32.97] },
  { id: 'xinyang-east', name: '信阳东', position: [114.08, 32.13] },
  { id: 'kaifeng-north', name: '开封北', position: [114.35, 34.83] },
  { id: 'lankao-south', name: '兰考南', position: [114.81, 34.76] },
  { id: 'minquan-north', name: '民权北', position: [115.14, 34.66] },
  { id: 'luoyang-longmen', name: '洛阳龙门', position: [112.46, 34.62] },
  { id: 'gongyi-south', name: '巩义南', position: [112.97, 34.70] },
  { id: 'jiaozuo', name: '焦作', position: [113.23, 35.24] },
  { id: 'jiyuan-east', name: '济源东', position: [112.60, 35.08] },
  { id: 'fuyang-west', name: '阜阳西', position: [115.82, 32.89] },
  { id: 'airport-east', name: '机场东', position: [113.84, 34.53] },
  { id: 'songchenglu', name: '宋城路', position: [114.31, 34.80] },
]

export const fleetSignalLossProfiles: FleetSignalLossProfile[] = [
  {
    typeLabel: '普通列车',
    rsrp: -91.2,
    sinr: 14.3,
    note: '相同区段信号更稳',
  },
  {
    typeLabel: '动车组',
    rsrp: -100.5,
    sinr: 12.6,
    note: '额外损耗约 6~9 dB',
  },
]

export const provinceLegendItems: Array<{ label: string; signalLevel: SignalLevel }> = [
  { label: '优', signalLevel: 'good' },
  { label: '预警', signalLevel: 'attention' },
  { label: '风险', signalLevel: 'risk' },
]

export const routeTrainInsights: RouteTrainInsight[] = [
  {
    id: 'jingguang-g79',
    routeId: 'jingguang-hsr',
    trainNo: 'G79',
    trainType: '高铁',
    model: '动车组',
    riskScore: 92,
    coverageRate: 61.8,
    issue: '跨区切换抖动',
  },
  {
    id: 'jingguang-g503',
    routeId: 'jingguang-hsr',
    trainNo: 'G503',
    trainType: '高铁',
    model: '动车组',
    riskScore: 88,
    coverageRate: 64.1,
    issue: '弱覆盖冲击',
  },
  {
    id: 'jingguang-d37',
    routeId: 'jingguang-hsr',
    trainNo: 'D37',
    trainType: '动车',
    model: '动车组',
    riskScore: 79,
    coverageRate: 70.4,
    issue: '5G 驻留不稳',
  },
  {
    id: 'xulan-g1912',
    routeId: 'xulan-hsr',
    trainNo: 'G1912',
    trainType: '高铁',
    model: '动车组',
    riskScore: 73,
    coverageRate: 82.6,
    issue: '站间速率下滑',
  },
  {
    id: 'xulan-g3154',
    routeId: 'xulan-hsr',
    trainNo: 'G3154',
    trainType: '高铁',
    model: '动车组',
    riskScore: 67,
    coverageRate: 85.2,
    issue: '上行能力偏低',
  },
  {
    id: 'xulan-k362',
    routeId: 'xulan-hsr',
    trainNo: 'K362',
    trainType: '普速',
    model: '普通列车',
    riskScore: 58,
    coverageRate: 89.1,
    issue: '车体损耗偏高',
  },
  {
    id: 'zhengyu-g3401',
    routeId: 'zhengyu-hsr',
    trainNo: 'G3401',
    trainType: '高铁',
    model: '动车组',
    riskScore: 46,
    coverageRate: 93.6,
    issue: '短时抖动',
  },
  {
    id: 'zhengyu-g3478',
    routeId: 'zhengyu-hsr',
    trainNo: 'G3478',
    trainType: '高铁',
    model: '动车组',
    riskScore: 44,
    coverageRate: 94.2,
    issue: '隧道边缘切换',
  },
  {
    id: 'zhengyu-d2205',
    routeId: 'zhengyu-hsr',
    trainNo: 'D2205',
    trainType: '动车',
    model: '动车组',
    riskScore: 41,
    coverageRate: 95.1,
    issue: '弱感知告警',
  },
  {
    id: 'jinzheng-g6916',
    routeId: 'jinzheng-hsr',
    trainNo: 'G6916',
    trainType: '高铁',
    model: '动车组',
    riskScore: 48,
    coverageRate: 92.9,
    issue: '高负荷抖动',
  },
  {
    id: 'jinzheng-d1672',
    routeId: 'jinzheng-hsr',
    trainNo: 'D1672',
    trainType: '动车',
    model: '动车组',
    riskScore: 43,
    coverageRate: 93.8,
    issue: '区间速率震荡',
  },
  {
    id: 'jinzheng-g2078',
    routeId: 'jinzheng-hsr',
    trainNo: 'G2078',
    trainType: '高铁',
    model: '动车组',
    riskScore: 40,
    coverageRate: 94.4,
    issue: '短时回落',
  },
  {
    id: 'zhengtai-g3194',
    routeId: 'zhengtai-hsr',
    trainNo: 'G3194',
    trainType: '高铁',
    model: '动车组',
    riskScore: 42,
    coverageRate: 92.1,
    issue: '坡段衰落',
  },
  {
    id: 'zhengtai-d2781',
    routeId: 'zhengtai-hsr',
    trainNo: 'D2781',
    trainType: '动车',
    model: '动车组',
    riskScore: 39,
    coverageRate: 93.3,
    issue: '切换回落',
  },
  {
    id: 'zhengtai-g7908',
    routeId: 'zhengtai-hsr',
    trainNo: 'G7908',
    trainType: '高铁',
    model: '动车组',
    riskScore: 37,
    coverageRate: 94.2,
    issue: '上行波动',
  },
  {
    id: 'zhengfu-g1907',
    routeId: 'zhengfu-hsr',
    trainNo: 'G1907',
    trainType: '高铁',
    model: '动车组',
    riskScore: 36,
    coverageRate: 95.2,
    issue: '边缘驻留',
  },
  {
    id: 'zhengfu-d2198',
    routeId: 'zhengfu-hsr',
    trainNo: 'D2198',
    trainType: '动车',
    model: '动车组',
    riskScore: 33,
    coverageRate: 95.8,
    issue: '瞬时干扰',
  },
  {
    id: 'zhengfu-k1102',
    routeId: 'zhengfu-hsr',
    trainNo: 'K1102',
    trainType: '普速',
    model: '普通列车',
    riskScore: 29,
    coverageRate: 96.6,
    issue: '车体损耗',
  },
  {
    id: 'zhengji-c2851',
    routeId: 'zhengji-intercity',
    trainNo: 'C2851',
    trainType: '动车',
    model: '动车组',
    riskScore: 22,
    coverageRate: 97.1,
    issue: '短时切换',
  },
  {
    id: 'zhengji-c2856',
    routeId: 'zhengji-intercity',
    trainNo: 'C2856',
    trainType: '动车',
    model: '动车组',
    riskScore: 19,
    coverageRate: 97.9,
    issue: '边缘抖动',
  },
  {
    id: 'zhengji-c2868',
    routeId: 'zhengji-intercity',
    trainNo: 'C2868',
    trainType: '动车',
    model: '动车组',
    riskScore: 17,
    coverageRate: 98.6,
    issue: '轻微回落',
  },
  {
    id: 'zhengkai-c2901',
    routeId: 'zhengkai-intercity',
    trainNo: 'C2901',
    trainType: '动车',
    model: '动车组',
    riskScore: 21,
    coverageRate: 96.4,
    issue: '分流段抖动',
  },
  {
    id: 'zhengkai-c2912',
    routeId: 'zhengkai-intercity',
    trainNo: 'C2912',
    trainType: '动车',
    model: '动车组',
    riskScore: 18,
    coverageRate: 97.2,
    issue: '瞬时掉速',
  },
  {
    id: 'zhengkai-c2920',
    routeId: 'zhengkai-intercity',
    trainNo: 'C2920',
    trainType: '动车',
    model: '动车组',
    riskScore: 16,
    coverageRate: 98.1,
    issue: '轻微抖动',
  },
]

export const routeIssueSummaries: RouteIssueSummary[] = [
  {
    routeId: 'jingguang-hsr',
    primaryIssue: '区间弱覆盖',
    segmentLabel: '北向主通道',
    badEventCount: 28,
    worstTrain: 'G79',
    severity: 'risk',
  },
  {
    routeId: 'xulan-hsr',
    primaryIssue: '站间速率下滑',
    segmentLabel: '西向主通道',
    badEventCount: 16,
    worstTrain: 'G1912',
    severity: 'attention',
  },
  {
    routeId: 'zhengyu-hsr',
    primaryIssue: '隧道边缘切换',
    segmentLabel: '西南联络段',
    badEventCount: 7,
    worstTrain: 'G3401',
    severity: 'good',
  },
  {
    routeId: 'jinzheng-hsr',
    primaryIssue: '高负荷抖动',
    segmentLabel: '东北联络段',
    badEventCount: 6,
    worstTrain: 'G6916',
    severity: 'good',
  },
  {
    routeId: 'zhengtai-hsr',
    primaryIssue: '坡段衰落',
    segmentLabel: '西北联络段',
    badEventCount: 5,
    worstTrain: 'G3194',
    severity: 'good',
  },
  {
    routeId: 'zhengfu-hsr',
    primaryIssue: '边缘驻留',
    segmentLabel: '东南主通道',
    badEventCount: 4,
    worstTrain: 'G1907',
    severity: 'good',
  },
  {
    routeId: 'zhengji-intercity',
    primaryIssue: '短时切换',
    segmentLabel: '机场联络段',
    badEventCount: 3,
    worstTrain: 'C2851',
    severity: 'good',
  },
  {
    routeId: 'zhengkai-intercity',
    primaryIssue: '分流段抖动',
    segmentLabel: '东向城际段',
    badEventCount: 3,
    worstTrain: 'C2901',
    severity: 'good',
  },
]
