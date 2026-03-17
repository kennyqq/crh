# High-Speed Expo Demo Implementation Plan

> **For Agent:** This document is the single source of truth for implementing the high-speed rail expo demo in `D:\Codex\crh`.

**Goal:** Build a pure-frontend expo demo for wireless smart-board railway assurance, with four screens (`P0` to `P3`), no backend dependency, strong visual impact, and lecturer-friendly interaction.

**Architecture:** The app is a single-page React + TypeScript + Vite experience. All data is local mock data. AMap is loaded directly in the browser and must gracefully fall back to a local SVG-based track map when network access fails. All “analysis”, “ticket lookup”, and “closure suggestion” behaviors are scenario-driven rather than computed from live systems.

**Tech Stack:** React 19, TypeScript, Vite, CSS, local mock data, AMap JS API, static preview deployment.

---

## 1. Product positioning

### 1.1 What this demo is

This is an **expo demonstration application**, not a production system. It is used to visually communicate the following value proposition:

1. Smart boards can do **5-second business-level perception**, unlike traditional PRS that stays at `15-minute` aggregation.
2. Smart boards can do **line-level virtual drive testing** for high-speed rail.
3. Smart boards can do **tiered and differentiated service assurance** for VIP users and key businesses.
4. Smart boards can do **complaint-to-network traceback**, turning a user complaint into a 5-second evidence chain and closure recommendation.

### 1.2 What this demo is not

- No real PRS, CRM, complaint system, or assurance policy backend integration
- No real work order dispatching
- No real network parameter push
- No real 12306 live API dependency
- No real AI free-form reasoning in runtime

Everything must be explainable as:

`Theoretically implementable in production, but fully stabilized and mocked for expo use.`

### 1.3 Core storyline

The lecturer story must always be:

1. `P0`: We can see the real experience shock at 5-second granularity.
2. `P1`: We can explain what the problem is and why it happened.
3. `P2`: We can intervene with differentiated assurance policies.
4. `P3`: We can trace a complaint back to network evidence and propose closure actions.

---

## 2. Overall screen specification

### 2.1 Primary canvas

- Primary resolution: `1920 x 1080`
- Secondary compatibility:
  - `3840 x 2160`
  - `1440 x 900`
  - `1366 x 768`
- Main mode: lecturer-controlled desktop browser fullscreen

### 2.2 Global shell layout

Use this exact spatial structure as the default desktop layout:

| Area | Width / Height | Notes |
| --- | --- | --- |
| Outer page padding | `28px` all around | Keep the command-wall breathing space |
| Top bar | Full width, about `220px` visual height | Title, time, screen tabs |
| Main content area | Remaining height between top bar and ticker | Split into stage + lecturer panel |
| Stage area | `calc(100% - 380px)` | Main storytelling canvas |
| Lecturer panel | `360px` fixed width | Scene shortcuts, next/prev, highlight toggle |
| Gap between stage and lecturer panel | `20px` | Always preserved |
| Bottom ticker | `48px` to `56px` visual height | Rolling elevator pitch |

### 2.3 Core style tokens

- Theme direction: `industrial command wall`
- Base background: deep navy / black-blue
- Accent colors:
  - Risk orange-red: `#ff6b3d` / `#ff7848`
  - Data cyan: `#7ae5ff`
  - Stability teal: `#18b6a6`
  - Capacity green: `#66d36e`
  - Warning yellow: `#ffca58`
- Card radius: `22px` to `28px`
- Card border: `1px solid rgba(255,255,255,0.08)`
- Shadows: large and soft, expo-grade, not web-dashboard-flat
- Typography:
  - Title scale should feel like a screen wall, not a web admin panel
  - Large title: `36px` to `52px`
  - Section title: `22px` to `30px`
  - Data number: `20px` to `32px`
  - Label / eyebrow: `12px` to `14px` with tracking

### 2.4 Motion rules

- Use motion only for:
  - page entry fade / rise
  - map highlight pulse
  - active timeline marker
  - ticker auto-scroll
- No excessive bouncing, spinning, or generic UI micro-animations
- The user must always feel this is a serious rail assurance cockpit

---

## 3. Page-by-page product specification

## 3.1 P0 Virtual Drive Test

### Business objective

Show that smart-board 5-second perception sees real user experience shocks on high-speed rail where traditional PRS still looks “normal”.

### Layout

Default 1920 layout inside the stage area:

| Module | Suggested size | Purpose |
| --- | --- | --- |
| Hero header | Full width, `180px` to `220px` | Page title and top KPI cards |
| Toolbar row | Full width, `56px` to `72px` | Route chips + train chips |
| Left map panel | About `62%` width | Route map, trains, risk segments |
| Right spotlight stack | About `38%` width | Selected train details + vehicle comparison |
| Bottom left chart | About `60%` width | PRS vs smart-board comparison |
| Bottom right risk list | About `40%` width | Risk segment cards |

### Required content

1. KPI cards
   - Covered routes
   - Active smart boards
   - Running trains
   - Risk trains

2. Map
   - Must show at least `3` routes
   - Must clearly highlight `1` sample route
   - Must show train markers
   - Must show risk segment markers
   - Must support AMap online + SVG fallback

3. Train spotlight
   - Train number
   - Model
   - Direction
   - Next station
   - Current smart-board status text
   - Current 5-second frame metrics

4. Dual timeline comparison
   - PRS experience line
   - Smart-board experience line
   - Current frame marker
   - Clear explanation that PRS remains stable while smart-board drops

5. Vehicle difference card
   - Compare normal train vs EMU / motor train
   - Explicitly call out `6-9 dB` additional loss

### Interaction

- Route chips switch the highlighted line
- Train chips switch the highlighted train
- Range slider moves the current 5-second frame
- “Previous frame / next frame” buttons step through the replay

### Default demo state

- Default route: `乌鲁木齐绕城 - 吐鲁番样板线`
- Default train: sample train with most obvious shock window
- Default frame: the first pre-damage or pre-shock frame

---

## 3.2 P1 Insight & Root Cause

### Business objective

Show that smart boards not only detect bad experience but can classify and explain the likely root cause.

### Layout

| Module | Suggested size | Purpose |
| --- | --- | --- |
| Hero header | Full width | Page title + summary |
| Left issue list | `36%` to `40%` width | 8 issue templates |
| Right map | `60%` to `64%` width | Segment heat and issue position |
| Bottom left analysis card | `50%` width | Insight title, summary, metrics, evidence |
| Bottom right issue portrait | `50%` width | Cause, confidence, closure state, action |

### Fixed issue templates

Must support these 8 categories:

1. Fault-caused weak coverage
2. Tunnel no coverage
3. 700M narrow bandwidth
4. Poor 5G continuity leading to fallback to 4G
5. Overlapping coverage causing poor downlink quality
6. Poor uplink quality causing low uplink rate
7. Weak uplink coverage causing drop
8. Excessive inter-site distance causing weak coverage

### Per-issue content

For each issue, the screen must show:

- Issue name
- Severity
- Count
- Location text
- Linked route segment
- Linked business type
- 3 evidence points
- Suggested action
- Confidence
- Closed / not closed state

### Required data panels

- 3 metric cards from the selected insight
- Evidence list
- Cause text
- Recommendation text
- Route segment highlight on map

### Interaction

- Clicking an issue card updates:
  - highlighted segment on the map
  - insight summary block
  - cause and action block

### Lecturer intent

This page must feel like:

`We don’t just show a red point; we explain why it is red.`

---

## 3.3 P2 Tiered Assurance

### Business objective

Show that smart boards can do VIP and critical-business differentiated assurance by adjusting `5QI` and `RFSP`, then validate the benefit using before/after evidence.

### Layout

| Module | Suggested size | Purpose |
| --- | --- | --- |
| Hero header | Full width | Page statement and value proposition |
| Scenario strip | Full width, `180px` to `220px` | 4 business scenarios |
| Left strategy panel | `50%` width | 5QI, RFSP, scheduler change |
| Right before/after panel | `50%` width | Business uplift bars |

### Fixed scenarios

Use these four scenarios:

1. Douyin short video
2. Honor of Kings gaming
3. WeChat upload
4. FTP download

### Mandatory before/after metrics

- Douyin:
  - Stall count
  - Playback delay
  - 720P+ share

- Gaming:
  - Average latency
  - Stall count
  - Recovery duration

- WeChat upload:
  - Upload rate
  - Low-speed ratio
  - Average RTT

- FTP download:
  - Download rate
  - Retransmission rate
  - Completion duration

### Interaction

- Select scenario card
- Click “trigger assurance”
- Toggle “before / after”
- Click “return to problem segment” to bring the lecturer back to `P1`

### Required explanation content

For the selected scenario, always show:

- Business goal
- 5QI change
- RFSP change
- Scheduler priority change
- Benefits list

### Lecturer intent

This page must feel like:

`The policy is understandable, measurable, and targeted at high-value users and services.`

---

## 3.4 P3 Complaint Closure

### Business objective

Show that a complaint can be traced back to 5-second network and service evidence, then turned into a structured closure recommendation.

### Layout

| Module | Suggested size | Purpose |
| --- | --- | --- |
| Hero header | Full width | Complaint closure value statement |
| Filter row | Full width | Search + level chips |
| Left complaint list | `320px` fixed width | Complaint master list |
| Middle map + chart stack | Flexible | Replay and route linkage |
| Right analysis stack | `400px` fixed width | Complaint detail, analysis, closure suggestions |

### Complaint list requirements

Every complaint item must show:

- Complaint title
- Summary
- Time
- Level
- Service type

Default filters:

- Search input
- Level chips: `全部 / 一般 / 严重 / 紧急`

### Replay behavior

Required replay window:

- Logical requirement: `T-5 min ~ T+5 min`
- Actual UI:
  - Slider over replay frames
  - Previous / next frame buttons
  - Current frame offset in seconds

Per replay frame must carry:

- Position
- RSRP
- SINR
- Network mode (`5G` or `4G`)
- RTT
- Uplink Mbps
- Downlink Mbps
- Retransmission
- Low-speed ratio
- Optional alert text

### Right-side panels

1. Complaint detail
   - Anonymous user ID
   - Complaint title
   - Current frame offset
   - Current network mode
   - Related alert

2. Smart analysis
   - Probable cause
   - Confidence
   - Evidence bullets
   - Historical match sentence

3. Closure recommendations
   - At least 3 items
   - Must include:
     - category
     - title
     - owner
     - ETA
     - action detail

### Lecturer intent

This page must feel like:

`A user complaint is no longer a vague text record; it becomes a visible, time-synced network event with actionable closure steps.`

---

## 4. Interaction design rules

### 4.1 Lecturer control panel

The right control panel is mandatory and must support:

- Previous step
- Next step
- Reset current page
- Highlight on / off
- Light autoplay on / off
- Direct scene selection

### 4.2 Scene system

Each page must have predefined scene steps.

Minimum scene count:

- `P0`: 3 scenes
- `P1`: 3 scenes
- `P2`: 3 scenes
- `P3`: 3 scenes

Each scene must be able to drive:

- focus route
- focus train
- focus segment(s)
- focus issue
- focus scenario
- focus complaint
- focus replay frame

### 4.3 Highlight mode

When highlight mode is on:

- the current scene’s target must visually dominate
- map markers must pulse or enlarge
- associated cards must adopt active border and background

When highlight mode is off:

- manual page state should remain usable
- no forced scene selection jumps

---

## 5. Technical implementation requirements

## 5.1 File structure

The implementing agent must use the current structure:

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | App shell, page switching, global scene state |
| `src/App.css` | Main expo styles |
| `src/index.css` | Global base styles |
| `src/types.ts` | Shared types |
| `src/mock/demoData.ts` | All route, train, issue, safeguard, complaint, scene data |
| `src/features/shared/*` | Shared UI pieces |
| `src/features/p0/*` | P0 page |
| `src/features/p1/*` | P1 page |
| `src/features/p2/*` | P2 page |
| `src/features/p3/*` | P3 page |

No backend folder is required.

## 5.2 Rendering model

- This is a SPA
- No routing library is required unless a future agent explicitly wants it
- Page switching can remain state-driven
- All chart rendering can stay SVG or CSS-based
- Avoid introducing heavy chart libraries unless absolutely necessary

## 5.3 Map strategy

Required:

1. Try loading AMap JS API
2. If AMap loads:
   - render route lines
   - render stations
   - render train tags
   - render risk segment markers
3. If AMap fails:
   - render SVG fallback with the same semantic overlays

The fallback must not feel like a degraded broken state. It should still look intentional.

## 5.4 Performance requirements

- Initial load target: `< 3s` on expo laptop
- Screen switch target: `< 1s`
- Replay frame switch target: `< 200ms`
- Build target: must pass `npm run build`

## 5.5 Stability requirements

- No page can depend on network responses except optional AMap script
- If AMap fails, the app must still be fully demoable
- No page should white-screen on missing mock data
- Default selections must always exist

---

## 6. Data filling specification

## 6.1 Data philosophy

All data is curated mock data designed to look believable, consistent, and teachable.

The agent must not generate random nonsense values. Every value needs a narrative purpose:

- highlight 5-second shock
- support a root cause hypothesis
- support a before/after uplift story
- support a complaint closure story

## 6.2 Required mock datasets

The single mock source file must contain at least:

1. `screenDefinitions`
2. `railRoutes`
3. `lineRiskSegments`
4. `trainRuns`
5. `trainReplayData`
6. `kqiInsights`
7. `rootCauseIssues`
8. `safeguardScenarios`
9. `complaintCases`
10. `demoScenes`
11. optional support constants such as KPI totals or ticker text

## 6.3 Mock rules by domain

### Routes

- At least `3` routes
- Exactly `1` route is the main sample route
- Every route must have:
  - id
  - name
  - corridor
  - color
  - cities
  - routePoints
  - stations

### Risk segments

- At least `8` segments
- Must cover all 8 issue categories
- Every segment must link to:
  - a route
  - an issue type
  - PRS score
  - smart-board score
  - score delta
  - map position

### Train replay

- At least `1` train must have a clearly visible shock window
- PRS values should remain comparatively stable
- smart-board values should show a sharp but believable dip
- signal and throughput values must correlate with the dip

### Safeguard scenarios

- Exactly `4` scenarios
- All before/after values must map to the business story
- After-values must always be visibly better than before-values

### Complaint cases

- At least `10` complaint items
- Every complaint must include:
  - metadata
  - replay frames
  - analysis
  - recommendations
- Replay frames should be programmatically generated where possible to reduce manual maintenance

## 6.4 Complaint replay generation rules

Recommended logic:

- Use a Gaussian or bell-curve dip around `t = 0`
- Signal penalty should worsen:
  - RSRP
  - SINR
  - RTT
  - retransmission
  - low-speed ratio
- Throughput should drop in the same time window
- Some cases should temporarily flip from `5G` to `4G`

This is enough to create a believable complaint replay without real backend data.

---

## 7. Acceptance checklist

The implementation is acceptable only if all of the following are true:

### Product acceptance

- P0 clearly demonstrates `PRS stable vs smart-board drop`
- P1 clearly demonstrates `issue type + cause + action`
- P2 clearly demonstrates `before vs after` uplift
- P3 clearly demonstrates `complaint -> replay -> analysis -> closure`

### Visual acceptance

- The app does not look like a generic admin dashboard
- Cards, layout, color, and motion feel intentional and expo-grade
- Large-screen readability is strong from a standing distance

### Technical acceptance

- `npm run build` passes
- App works without backend
- AMap failure does not break the app
- All screen states are driven by local data

---

## 8. Recommended implementation order for another agent

1. Create or validate all shared types in `src/types.ts`
2. Fill `src/mock/demoData.ts` completely
3. Build the app shell in `src/App.tsx`
4. Implement shared components:
   - top bar
   - lecturer panel
   - metric card
   - line chart
   - map with fallback
5. Implement P0
6. Implement P1
7. Implement P2
8. Implement P3
9. Tune styles and spacing
10. Verify `npm run build`

If another agent follows this document closely, they should be able to build or rebuild the full demo without product-side ambiguity.
