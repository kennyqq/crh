# 高铁无线智能化运营 Demo 交接包

## 1. 这是什么项目

这是一个面向展会/汇报场景的纯前端 Demo，技术栈是 `React + TypeScript + Vite`。

产品目标不是做生产系统，而是做一个“看起来像真实运营系统”的演示大屏，当前保留 3 个页面：

1. `P0 线路态势`
2. `P1 感知洞察`
3. `P2 策略保障`

`P3 投诉回溯` 已从应用入口删除，不再在导航中出现。

## 2. 当前页面状态

### P0 线路态势

- 目标：展示省域高铁线路总体质量态势，地图主导，右侧是概览、排序、车型对比。
- 主地图优先使用 `高德暗色底图 + Loca/AMap 线路层`，并保留本地渲染逻辑。
- 数据是 mock，但已经尽量朝“整体稳定、局部问题突出”的方向调整。
- 已经补了更多城市和车站标注，且尝试做主次层级。

当前主要文件：

- `D:\Codex\crh\src\features\p0\P0VirtualRouteTest.tsx`
- `D:\Codex\crh\src\mock\p0ProvinceData.ts`
- `D:\Codex\crh\src\features\p0\amapLocaLoader.ts`

### P1 感知洞察

- 目标：围绕单条样板线做告警主导的动态洞察。
- 交互主线已经改成“告警主导”，不是“时间切片主导”。
- 地图上默认展示 5 个告警点，点击地图点或右侧问题列表，应切换到该告警对应的代表时间片。
- 左侧下方有时间轴，作为从属导航，不是页面第一控制器。
- 右侧 3 个模块固定为：
  - `速率感知洞察`
  - `业务感知洞察`
  - `主要问题列表`

当前主要文件：

- `D:\Codex\crh\src\features\p1\P1CorridorMap.tsx`
- `D:\Codex\crh\src\features\p1\P1Insights.tsx`
- `D:\Codex\crh\src\features\p1\P1Timeline.tsx`
- `D:\Codex\crh\src\mock\p1CorridorData.ts`

### P2 策略保障

- 目标：展示“先选策略，再策略生效”的差异化保障体验。
- 页面结构已经重构为：
  - 上方：轻量策略区
  - 下方左侧：保障效果对比（双手机）
  - 下方右侧：关键业务体验差异
- P2 当前不引入地图。

当前主要文件：

- `D:\Codex\crh\src\features\p2\P2Safeguard.tsx`
- `D:\Codex\crh\src\mock\p2PolicyData.ts`

## 3. 当前应用结构

应用入口文件：

- `D:\Codex\crh\src\App.tsx`

当前入口逻辑：

- 只渲染 `p0 / p1 / p2`
- 当前屏幕由 `currentScreen` 控制
- 页签定义和场景定义来自 `screenData.ts`

注意：

- `D:\Codex\crh\src\mock\screenData.ts`
- `D:\Codex\crh\src\types.ts`

这两个文件里仍有一部分历史遗留的乱码字符串，需要后续统一清理。

## 4. 当前最重要的业务约束

这是接手时最不能搞错的部分：

### P0

- 整体线路态势应表现为“整体较好，局部有问题”
- 不要做成满屏大面积红线
- 地图必须是主视觉

### P1

- 整体线路网络应该表现为“多数区段良好，只有个别点有问题”
- 只保留 5 个主要告警点
- 默认显示全部 5 个告警
- 点击地图告警点或右侧问题列表，自动切到对应时间切片
- 时间轴只是辅助讲解，不是主逻辑
- 热力/线路颜色口径用户最新要求是：
  - 图例改成 `信号电平 RSRP`
  - 只用三色：`红 / 黄 / 绿`
  - 语义：`差 / 良 / 优`
  - 线路应以绿色居多，不要蓝色热力
- 告警点颜色与热力图区分：
  - 深红
  - 橙色
  - 蓝色

### P2

- 重点是“策略选择后，权益用户和普通用户体验拉开差距”
- 不要堆很多参数说明文字
- 让手机像真实终端，不要像占位框
- 不要保留讲解词式描述文字

## 5. 最近已经完成的关键重构

### 已完成

1. 导航从 4 页签收缩为 3 页签，P3 不再出现在入口中。
2. P0 改成地图主导的省域线路态势页。
3. P1 从“时间主导”改成“告警主导”。
4. P2 改成“轻量策略区 + 双手机对比 + 关键业务差异”。
5. 顶层视觉做过一轮降噪，减少了部分过重容器感。

### 已知仍需继续收口

1. `P1` 仍然是整个项目里最容易被改坏的一页。
2. `screenData.ts` 和 `types.ts` 有历史乱码，需要统一清理。
3. `P1` 的地图渲染逻辑经历过多次切换，接手时要先确认当前是不是 AMap 主方案。
4. `P1` 的图例和颜色逻辑最近又被用户追加改动，可能还没完全按最终要求落齐。

## 6. 当前最容易踩坑的地方

### 坑 1：P1 地图容易被改回 fallback 味道

用户明确要求：

- `P1` 需要使用高德地图的空间感
- 不接受只有一条抽象线的 fallback 主呈现

所以如果接手时发现：

- 没有高德底图
- 只有深色网格和一条抽象线

那就说明 `P1` 被改坏了，需要回到 `AMap` 主方案。

### 坑 2：P1 很容易变成“整体网络很差”

用户非常在意这个口径：

- 不能满屏都是红的和黄的
- 领导会误判网络很差

因此：

- 要让大多数区段表现为正常
- 只有 5 个问题点附近局部异常
- 右侧指标多数时间应表现为较好

### 坑 3：P2 很容易回到“说明太多”

用户已经明确要求删掉很多描述性文字，所以接手时不要重新加回：

- “保障前效果相近”
- “当前链路稳定”
- “权益差异尚未拉开”

这些讲解词式文案。

## 7. 当前待继续处理的明确事项

以下是用户在最近几轮明确提过、但不一定已经完全最终落齐的点：

### P1 待确认项

1. 左上标题要显示成：
   - `京广高速线 - 对应站点名`
   - 也就是点击哪个告警，就显示对应站点名
2. 右侧问题表中的表头 `位置` 应改成 `站点`
3. 图例中的热力名称要改为 `信号电平 RSRP`
4. 热力三色改成：
   - 红 = 差
   - 黄 = 良
   - 绿 = 优
5. 告警点颜色改为：
   - 深红
   - 橙
   - 蓝
6. 线路整体颜色应绿色居多，不要蓝色为主

### P0 待优化项

1. 地图标注层级可以继续做得更高级
2. 枢纽站、普通站、城市标注建议进一步拉开层级

### P2 待优化项

1. 手机外壳仍可继续做得更像真实终端
2. 视频容器内容可进一步减少“占位感”

## 8. 当前代码和数据的关键映射关系

### 页面入口

- `D:\Codex\crh\src\App.tsx`

### 页签与场景

- `D:\Codex\crh\src\mock\screenData.ts`

### 通用类型

- `D:\Codex\crh\src\types.ts`

### P0

- 组件：`D:\Codex\crh\src\features\p0\P0VirtualRouteTest.tsx`
- 数据：`D:\Codex\crh\src\mock\p0ProvinceData.ts`

### P1

- 地图：`D:\Codex\crh\src\features\p1\P1CorridorMap.tsx`
- 页面：`D:\Codex\crh\src\features\p1\P1Insights.tsx`
- 时间轴：`D:\Codex\crh\src\features\p1\P1Timeline.tsx`
- 数据：`D:\Codex\crh\src\mock\p1CorridorData.ts`

### P2

- 页面：`D:\Codex\crh\src\features\p2\P2Safeguard.tsx`
- 数据：`D:\Codex\crh\src\mock\p2PolicyData.ts`

### 样式

- `D:\Codex\crh\src\App.css`
- `D:\Codex\crh\src\index.css`

## 9. 当前 Git 和工作区状态

最近远端公开仓库最新历史里可见的提交是：

- `5790dae feat: refine demo screens and navigation`
- `96bc9de build: allow legacy peer deps on deploy`
- `2f58bb5 docs: refine README`
- `e7c364e Initial expo demo implementation`

但本地仍有未推送改动，尤其集中在：

- `src/App.css`
- `src/features/p0/P0VirtualRouteTest.tsx`
- `src/features/p1/P1CorridorMap.tsx`
- `src/features/p1/P1Insights.tsx`
- `src/features/p1/P1Timeline.tsx`
- `src/features/p2/P2Safeguard.tsx`
- `src/features/shared/DataPanel.tsx`
- `src/features/shared/TopBar.tsx`
- `src/mock/p0ProvinceData.ts`
- `src/mock/p1CorridorData.ts`

另外还有一份未跟踪的中文文档：

- `D:\Codex\crh\doc\高铁无线智能化运营-界面整改执行说明.md`

## 10. 启动、构建与验证

本地目录：

- `D:\Codex\crh`

常用命令：

```powershell
cd D:\Codex\crh
npm.cmd run build
```

项目里还提供了：

- `D:\Codex\crh\start_demo.bat`
- `D:\Codex\crh\stop_demo.bat`

如果页面表现与代码不一致，优先重启预览进程，再继续判断。

## 11. 接手建议

给下一位 Agent 的建议顺序：

1. 先读本文件
2. 再读：
   - `D:\Codex\crh\src\App.tsx`
   - `D:\Codex\crh\src\mock\screenData.ts`
   - `D:\Codex\crh\src\features\p1\P1CorridorMap.tsx`
   - `D:\Codex\crh\src\mock\p1CorridorData.ts`
3. 优先处理 P1，不要先动 P0/P2
4. 每次改完先本地 `build`
5. 再实际点开 P1 验证：
   - 是否还是高德地图
   - 告警点还能不能点
   - 时间轴是否联动
   - 右侧问题表是不是全量 5 条
   - 颜色口径是否符合“整体良好、局部问题”

## 12. 一句话总结

这个项目已经从“原型草图”走到“可讲可演”的阶段了，但 `P1` 仍然是全局最脆弱的部分。接手时请把注意力优先放在 `P1 的地图渲染、告警联动、颜色口径和中文文案一致性` 上，而不是继续加新功能。
