import type { P2PolicyCard } from '../types'

const sharedMockClips = [
  {
    id: 'douyin-stutter',
    title: '抖音卡顿',
    subtitle: '未加速 / 画面加载断续',
    tone: 'stutter' as const,
  },
  {
    id: 'douyin-smooth',
    title: '抖音流畅',
    subtitle: '正常播放 / 滑动顺畅',
    tone: 'smooth' as const,
  },
  {
    id: 'douyin-boost',
    title: '加速生效',
    subtitle: '卡顿转流畅 / 可替换真实录屏',
    tone: 'boost' as const,
  },
]

export const p2PolicyCards: P2PolicyCard[] = [
  {
    id: 'global-pass',
    name: '全球通钻白卡',
    summary: '面向高价值用户，对关键业务进行差异化优先调度。',
    scopeLabel: '18个APP',
    parameterBadges: [
      { label: '5QI', value: '6' },
      { label: '调度权重', value: '800' },
      { label: 'minBR', value: '5M' },
    ],
    businessCategories: ['短视频', '长视频', '网页', '文件传输', '游戏'],
    appGroups: [
      { category: '短视频', apps: ['抖音', '快手', '西瓜视频', '微信视频号'] },
      { category: '长视频', apps: ['爱奇艺', '腾讯视频', '优酷', '哔哩哔哩'] },
      { category: '网页', apps: ['今日头条', '腾讯新闻', '百度', '微博'] },
      { category: '文件传输', apps: ['百度网盘', '移动云盘', '企业网盘'] },
      { category: '游戏', apps: ['王者荣耀', '和平精英', 'QQ游戏'] },
    ],
    phoneComparison: {
      before: {
        vip: { status: '同等体验', tone: 'neutral' },
        standard: { status: '同等体验', tone: 'neutral' },
      },
      after: {
        vip: { status: '流畅', tone: 'boosted' },
        standard: { status: '一般', tone: 'steady' },
      },
    },
    metricRows: [
      {
        label: '短视频下行速率',
        before: { vip: '16.8 Mbps', standard: '16.2 Mbps' },
        after: { vip: '22.8 Mbps', standard: '16.5 Mbps' },
        improvement: '+35.7%',
      },
      {
        label: '视频会议速率',
        before: { vip: '3.9 Mbps', standard: '3.8 Mbps' },
        after: { vip: '6.4 Mbps', standard: '4.0 Mbps' },
        improvement: '+64.1%',
      },
      {
        label: '长视频高清占比（720+）',
        before: { vip: '68%', standard: '67%' },
        after: { vip: '88%', standard: '69%' },
        improvement: '+20pp',
      },
      {
        label: '游戏时延 RTT',
        before: { vip: '78 ms', standard: '79 ms' },
        after: { vip: '48 ms', standard: '74 ms' },
        improvement: '-30 ms',
      },
      {
        label: '流量使用',
        before: { vip: '1.8 GB', standard: '1.7 GB' },
        after: { vip: '2.9 GB', standard: '1.8 GB' },
        improvement: '+61.1%',
      },
    ],
    mockClips: sharedMockClips,
  },
  {
    id: 'hsr-boost-pack',
    name: '高铁加速权益包',
    summary: '叠加 RFSP 与最小保障速率，在高铁冲击场景下优先保障权益用户。',
    scopeLabel: '18个APP',
    parameterBadges: [
      { label: '5QI', value: '6' },
      { label: '调度权重', value: '800' },
      { label: 'RFSP', value: '34' },
      { label: 'RFSP权重', value: '3000' },
      { label: 'minBR', value: '5M' },
    ],
    businessCategories: ['短视频', '长视频', '网页', '文件传输', '游戏'],
    appGroups: [
      { category: '短视频', apps: ['抖音', '快手', '微信视频号', '小红书'] },
      { category: '长视频', apps: ['爱奇艺', '腾讯视频', '优酷', '哔哩哔哩'] },
      { category: '网页', apps: ['今日头条', '腾讯新闻', '百度', 'UC浏览器'] },
      { category: '文件传输', apps: ['百度网盘', '移动云盘', '企业邮箱'] },
      { category: '游戏', apps: ['王者荣耀', '和平精英', 'QQ游戏'] },
    ],
    phoneComparison: {
      before: {
        vip: { status: '同等体验', tone: 'neutral' },
        standard: { status: '同等体验', tone: 'neutral' },
      },
      after: {
        vip: { status: '流畅', tone: 'boosted' },
        standard: { status: '轻微卡顿', tone: 'steady' },
      },
    },
    metricRows: [
      {
        label: '短视频下行速率',
        before: { vip: '17.4 Mbps', standard: '17.0 Mbps' },
        after: { vip: '24.6 Mbps', standard: '17.2 Mbps' },
        improvement: '+41.4%',
      },
      {
        label: '视频会议速率',
        before: { vip: '4.2 Mbps', standard: '4.0 Mbps' },
        after: { vip: '6.8 Mbps', standard: '4.1 Mbps' },
        improvement: '+61.9%',
      },
      {
        label: '长视频高清占比（720+）',
        before: { vip: '71%', standard: '70%' },
        after: { vip: '91%', standard: '72%' },
        improvement: '+20pp',
      },
      {
        label: '游戏时延 RTT',
        before: { vip: '75 ms', standard: '76 ms' },
        after: { vip: '44 ms', standard: '72 ms' },
        improvement: '-31 ms',
      },
      {
        label: '流量使用',
        before: { vip: '2.1 GB', standard: '2.0 GB' },
        after: { vip: '3.4 GB', standard: '2.1 GB' },
        improvement: '+61.9%',
      },
    ],
    mockClips: sharedMockClips,
  },
  {
    id: 'roam-stimulus',
    name: '漫入流量激发',
    summary: '通过优先保障高感知业务，带动权益用户时长与流量使用提升。',
    scopeLabel: '18个APP',
    parameterBadges: [
      { label: '5QI', value: '6' },
      { label: '调度权重', value: '1000' },
      { label: '业务范围', value: '5类' },
      { label: '策略目标', value: '流量激发' },
    ],
    businessCategories: ['短视频', '网页', '长视频', '文件传输', '游戏'],
    appGroups: [
      { category: '短视频', apps: ['抖音', '快手', '小红书'] },
      { category: '网页', apps: ['今日头条', '百度', '腾讯新闻', '微博'] },
      { category: '长视频', apps: ['爱奇艺', '腾讯视频', '哔哩哔哩'] },
      { category: '文件传输', apps: ['百度网盘', '移动云盘', '企业邮箱'] },
      { category: '游戏', apps: ['王者荣耀', '和平精英'] },
    ],
    phoneComparison: {
      before: {
        vip: { status: '同等体验', tone: 'neutral' },
        standard: { status: '同等体验', tone: 'neutral' },
      },
      after: {
        vip: { status: '流畅', tone: 'smooth' },
        standard: { status: '一般', tone: 'steady' },
      },
    },
    metricRows: [
      {
        label: '短视频下行速率',
        before: { vip: '16.1 Mbps', standard: '15.9 Mbps' },
        after: { vip: '21.7 Mbps', standard: '16.0 Mbps' },
        improvement: '+34.8%',
      },
      {
        label: '视频会议速率',
        before: { vip: '3.7 Mbps', standard: '3.6 Mbps' },
        after: { vip: '5.9 Mbps', standard: '3.8 Mbps' },
        improvement: '+59.5%',
      },
      {
        label: '长视频高清占比（720+）',
        before: { vip: '65%', standard: '64%' },
        after: { vip: '84%', standard: '66%' },
        improvement: '+19pp',
      },
      {
        label: '游戏时延 RTT',
        before: { vip: '81 ms', standard: '82 ms' },
        after: { vip: '55 ms', standard: '79 ms' },
        improvement: '-26 ms',
      },
      {
        label: '流量使用',
        before: { vip: '1.6 GB', standard: '1.6 GB' },
        after: { vip: '2.5 GB', standard: '1.7 GB' },
        improvement: '+56.3%',
      },
    ],
    mockClips: sharedMockClips,
  },
]

export const p2ScenePolicyMap: Record<string, string> = {
  'scene-p2-policy': 'global-pass',
  'scene-p2-boost': 'hsr-boost-pack',
  'scene-p2-roam': 'roam-stimulus',
}
