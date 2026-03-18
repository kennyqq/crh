export type ScreenCode = 'p0' | 'p1' | 'p2'

export type Coordinates = [number, number]

export type Severity = 'notice' | 'warning' | 'critical'

export type ComplaintLevel = '一般' | '严重' | '紧急'

export type ComplaintStatus = '待分析' | '待处理' | '已验证' | '已闭环'

export interface DemoScene {
  id: string
  screen: ScreenCode
  title: string
  kicker: string
  summary: string
  callouts: string[]
  focusRouteId?: string
  focusTrainId?: string
  focusSegmentIds?: string[]
  focusIssueId?: string
  focusScenarioId?: string
  focusComplaintId?: string
  focusFrameIndex?: number
}

export interface ScreenDefinition {
  code: ScreenCode
  title: string
  shortTitle: string
  slogan: string
  summary: string
}

export interface RailStation {
  id: string
  name: string
  position: Coordinates
  kind: 'hub' | 'station'
}

export interface RailRoute {
  id: string
  name: string
  corridor: string
  color: string
  cities: string[]
  lineType: '样板线' | '联动线'
  routePoints: Coordinates[]
  stations: RailStation[]
}

export interface LineRiskSegment {
  id: string
  routeId: string
  label: string
  fromStation: string
  toStation: string
  severity: Severity
  issueType: string
  prsScore: number
  boardScore: number
  delta: number
  position: Coordinates
}

export interface TrainRun {
  id: string
  routeId: string
  trainNo: string
  model: '动车组' | '普速列车' | '复兴号'
  direction: string
  speedKmh: number
  passengerLoad: number
  position: Coordinates
  nextStation: string
  boardStatus: string
  routeSummary: string
}

export interface TrainReplayFrame {
  timestampLabel: string
  trainId: string
  routeId: string
  position: Coordinates
  prsExperience: number
  boardExperience: number
  rsrp: number
  sinr: number
  uplinkMbps: number
  downlinkMbps: number
  status: 'stable' | 'shock' | 'handover' | 'recover'
  highlightSegmentId?: string
}

export interface InsightMetric {
  label: string
  value: string
  note: string
}

export interface KqiInsight {
  id: string
  service: string
  title: string
  severity: Severity
  summary: string
  metrics: InsightMetric[]
  evidence: string[]
  recommendation: string
}

export interface RootCauseIssue {
  id: string
  linkedInsightId: string
  linkedSegmentId: string
  name: string
  severity: Severity
  count: number
  location: string
  summary: string
  cause: string
  suggestion: string
  confidence: number
  closed: boolean
}

export interface SafeguardMetric {
  label: string
  before: number
  after: number
  unit: string
}

export interface SafeguardScenario {
  id: string
  serviceName: string
  persona: string
  linkedSegmentId: string
  objective: string
  strategy: {
    fiveQi: string
    rfsp: string
    schedulerPriority: string
  }
  metrics: SafeguardMetric[]
  benefits: string[]
}

export interface ComplaintReplayFrame {
  offsetSeconds: number
  position: Coordinates
  rsrp: number
  sinr: number
  networkMode: '5G' | '4G'
  rtt: number
  uplinkMbps: number
  downlinkMbps: number
  retransmission: number
  lowSpeedRatio: number
  alert?: string
}

export interface ComplaintAnalysis {
  complaintId: string
  probableCause: string
  confidence: number
  evidence: string[]
  historicalMatch: string
  relatedAlert: string
}

export interface ClosureRecommendation {
  id: string
  category: string
  title: string
  owner: string
  eta: string
  action: string
  status: ComplaintStatus
}

export interface ComplaintCase {
  id: string
  userTag: string
  routeId: string
  trainId: string
  timeLabel: string
  service: string
  level: ComplaintLevel
  title: string
  summary: string
  segmentId: string
  status: ComplaintStatus
  replayFrames: ComplaintReplayFrame[]
  analysis: ComplaintAnalysis
  recommendations: ClosureRecommendation[]
}

export type SignalLevel = 'good' | 'attention' | 'risk'

export interface ProvinceRailSegment {
  id: string
  routeId: string
  points: Coordinates[]
  signalLevel: SignalLevel
  rsrpMock: number
  sinrMock: number
}

export interface ProvinceRailRoute {
  id: string
  name: string
  riskLevel: SignalLevel
  polylinePoints: Coordinates[]
  segments: ProvinceRailSegment[]
  stationPoints: Coordinates[]
  coverageRate: number
  avgRsrp: number
  avgSinr: number
  avgUplinkMbps: number
  avgDownlinkMbps: number
  badEventCount: number
  narrative: string
}

export interface OverviewMetric {
  label: string
  value: string
  note: string
  tone?: 'default' | 'accent' | 'warning' | 'critical'
}

export interface FleetSignalLossProfile {
  typeLabel: string
  rsrp: number
  sinr: number
  note: string
}

export interface RouteTrainInsight {
  id: string
  routeId: string
  trainNo: string
  trainType: '高铁' | '动车' | '普速'
  model: '动车组' | '普通列车'
  riskScore: number
  coverageRate: number
  issue: string
}

export interface RouteIssueSummary {
  routeId: string
  primaryIssue: string
  segmentLabel: string
  badEventCount: number
  worstTrain: string
  severity: SignalLevel
}

export interface RailCoverageProperties {
  id: string
  lineName: string
  coverageRate: number
  status: '优秀' | '良好' | '盲区'
  riskLevel: SignalLevel
  avgRsrp: number
  avgSinr: number
  avgUplinkMbps: number
  avgDownlinkMbps: number
  badEventCount: number
}

export interface RailCoverageFeature {
  type: 'Feature'
  geometry: {
    type: 'LineString' | 'MultiLineString'
    coordinates: Coordinates[] | Coordinates[][]
  }
  properties: RailCoverageProperties
}

export interface RailCoverageGeoJson {
  type: 'FeatureCollection'
  features: RailCoverageFeature[]
}

export type MapRenderMode = 'amap' | 'fallback-svg'

export type P1MetricKey =
  | 'rsrp'
  | 'sinr'
  | 'uplinkAvg'
  | 'downlinkAvg'
  | 'serviceComposite'

export type P1IssueType =
  | 'spacing'
  | 'uplinkWeak'
  | 'coverageFault'
  | 'fiveGAbnormal'
  | 'tunnelIntermittent'

export interface P1MetricOption {
  key: P1MetricKey
  label: string
}

export interface P1CorridorCell {
  id: string
  segmentLabel: string
  position: Coordinates
  corners: Coordinates[]
  values: Record<P1MetricKey, number>
}

export interface P1TrackSample {
  id: string
  segmentLabel: string
  position: Coordinates
  meterMark: number
  values: Record<P1MetricKey, number>
}

export interface P1BaseStation {
  id: string
  label: string
  position: Coordinates
  section: string
}

export interface P1InsightMetric {
  label: string
  value: string
  tone?: 'default' | 'accent' | 'warning' | 'critical'
}

export interface P1InsightSection {
  title: string
  conclusion: string
  rows: P1InsightMetric[]
}

export interface P1IssueListItem {
  id: string
  type: P1IssueType
  label: string
  countLabel: string
  locationLabel: string
  siteLabel: string
  closed: boolean
  recommendation: string
  detail: string
}

export interface P1IssueMarker {
  id: string
  type: P1IssueType
  label: string
  position: Coordinates
  segmentLabel: string
}

export interface P1TrainRunSummary {
  trainNo: string
  trainType: '高铁' | '动车' | '普速'
  model: '动车组' | '普通列车'
}

export interface P1SliceMetricSnapshot {
  signalSummary: P1InsightMetric[]
  speedRows: P1InsightMetric[]
  serviceRows: P1InsightMetric[]
}

export interface P1SliceIssueOccurrence extends P1IssueListItem {
  trainNo: string
  trainType: '高铁' | '动车' | '普速'
}

export interface P1IssueBinding {
  issueType: P1IssueType
  sliceIds: string[]
  defaultSliceId: string
}

export interface P1TimelineSlice {
  id: string
  timeLabel: string
  minuteOffset: number
  train: P1TrainRunSummary
  activeIssueTypes: P1IssueType[]
  primaryIssueType: P1IssueType
  metrics: P1SliceMetricSnapshot
  issueOccurrences: P1SliceIssueOccurrence[]
}

export interface P1RouteProfile {
  routeId: string
  lineName: string
  routePoints: Coordinates[]
  stations: P1BaseStation[]
  corridorCells: P1CorridorCell[]
  trackSamples: P1TrackSample[]
  metricOptions: P1MetricOption[]
  signalSummary: P1InsightMetric[]
  speedInsight: P1InsightSection
  serviceInsight: P1InsightSection
  issueList: P1IssueListItem[]
  issueMarkers: P1IssueMarker[]
  defaultIssueType: P1IssueType
  issueBindings: P1IssueBinding[]
  defaultSliceId: string
  timelineSlices: P1TimelineSlice[]
}

export interface P2PolicyParameter {
  label: string
  value: string
}

export interface P2AppGroup {
  category: string
  apps: string[]
}

export interface P2PhoneViewState {
  status: string
  tone: 'neutral' | 'smooth' | 'boosted' | 'steady'
}

export interface P2PhoneComparisonState {
  before: {
    vip: P2PhoneViewState
    standard: P2PhoneViewState
  }
  after: {
    vip: P2PhoneViewState
    standard: P2PhoneViewState
  }
}

export interface P2BusinessMetricState {
  vip: string
  standard: string
}

export interface P2BusinessMetricRow {
  label: string
  before: P2BusinessMetricState
  after: P2BusinessMetricState
  improvement: string
}

export interface P2MockVideoClip {
  id: string
  title: string
  subtitle: string
  tone: 'stutter' | 'smooth' | 'boost'
}

export interface P2PolicyCard {
  id: string
  name: string
  summary: string
  scopeLabel: string
  parameterBadges: P2PolicyParameter[]
  businessCategories: string[]
  appGroups: P2AppGroup[]
  phoneComparison: P2PhoneComparisonState
  metricRows: P2BusinessMetricRow[]
  mockClips: P2MockVideoClip[]
}
