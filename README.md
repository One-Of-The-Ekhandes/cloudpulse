# ◈ CloudPulse

**Real-time Cloud Security Event Monitoring Dashboard**

A high-performance, zero-dependency security monitoring dashboard built with Vue 3 Composition API and TypeScript. Every component — SVG charts, virtual scrolling, theme engine, keyboard shortcuts — is hand-crafted with no external libraries beyond Vue itself.

![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?logo=typescript)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

### Real-time Event Stream
- Simulated WebSocket-style event generator producing realistic cloud security events
- Weighted severity distribution (critical events are rare, info events are common)
- Rolling window of 2,000 events with automatic cleanup
- Event categories: Authentication, Network, Data Access, Configuration, Malware, Policy Violation

### Custom SVG Stacked Area Chart
- Hand-built SVG chart with no charting library
- Stacked area visualization showing threat activity by severity over time
- Animated path transitions on data updates
- Dynamic Y-axis scaling and grid lines
- Time-axis labels with live timestamps

### Virtual Scrolling Engine
- Custom `useVirtualScroll` composable rendering only visible DOM nodes
- Handles thousands of events at 60fps with minimal memory footprint
- Configurable overscan buffer for smooth scroll experience
- Absolute positioning for zero layout thrashing

### Interactive Network Topology
- SVG-based network map with 8 interconnected infrastructure nodes
- Live status indicators (healthy/warning/critical) driven by threat score
- Animated data packet flow along connection paths
- Hover tooltips with node metadata
- Pulsing critical-state rings and dashed warning connections

### Threat Score Engine
- Reactive weighted scoring: `critical×40 + high×20 + medium×10 + low×3 + info×1`
- SVG donut gauge with animated stroke transitions
- Color-coded severity labels (NORMAL → ELEVATED → HIGH → CRITICAL)

### Advanced Filtering
- Real-time text search across event messages, sources, and destinations
- Toggle filters for each severity level and event category
- Live count display showing filtered vs total events

### Dark/Light Theme
- `useTheme` composable with CSS custom properties
- Persists to `localStorage`
- Respects `prefers-color-scheme` on first visit
- Instant transition with no flash

### Keyboard Shortcuts
- `S` — Start/stop event stream
- `T` — Toggle theme
- `C` — Clear all events
- `Shift + ?` — Show shortcuts modal
- Input-aware: shortcuts disabled when typing in search

---

## 🏗 Architecture

```
src/
├── composables/
│   ├── useEventStream.ts    # Event generation, metrics, threat scoring
│   ├── useVirtualScroll.ts  # Generic virtual scroll engine
│   ├── useTheme.ts          # Dark/light mode with persistence
│   └── useKeyboard.ts       # Global keyboard shortcut manager
├── components/
│   ├── StatusBar.vue        # Threat gauge + severity breakdown
│   ├── ThreatChart.vue      # Custom SVG stacked area chart
│   ├── EventLog.vue         # Virtual-scrolled event list with filters
│   └── NetworkMap.vue       # SVG network topology visualization
├── types/
│   └── index.ts             # TypeScript type system
├── App.vue                  # Dashboard layout + orchestration
├── main.ts
└── style.css
```

### Design Decisions

| Decision | Rationale |
|---|---|
| **Zero external dependencies** | Demonstrates deep understanding of Vue reactivity and DOM APIs |
| **Custom composables** | Showcases Composition API mastery — reusable, testable, typed |
| **SVG over Canvas** | Declarative, reactive, accessible — integrates naturally with Vue's template system |
| **Virtual scrolling** | Proves awareness of performance at scale — critical for monitoring dashboards |
| **CSS custom properties for theming** | Single source of truth, instant switches, zero JS recomputation |
| **TypeScript string literal union types** | Type-safe severities and categories with no runtime overhead |

---

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/One-Of-The-Ekhandes/cloudpulse.git
cd cloudpulse

# Install
npm install

# Dev server
npm run dev

# Production build
npm run build
```

Open `http://localhost:5173` — the dashboard auto-starts the event stream.

---

## 🧪 Technical Highlights

### Reactive Dependency Chain
```
raw events → severityCounts (computed)
                  ↓
            threatScore (computed) → drives gauge + network node status
                  ↓
            metrics snapshots → drives SVG chart paths
```

### Virtual Scroll Performance
With 2,000 events in the buffer, only ~15 DOM nodes exist at any time. The composable calculates visible range from `scrollTop` and `itemHeight`, rendering items with absolute positioning to avoid layout recalculation.

### SVG Chart Without a Library
The `ThreatChart` component computes stacked area paths by iterating severity layers bottom-up, accumulating Y offsets per data point, and generating SVG `<path>` `d` attributes with `M/L/Z` commands. Smooth transitions are achieved via CSS `transition: d 0.3s ease`.

---

## 📋 Tech Stack

- **Vue 3.5** — Composition API with `<script setup>`
- **TypeScript 6.x** — Strict mode, generics, union types
- **Vite** — Build tooling only
- **Pure CSS** — Custom properties, animations, responsive grid
- **SVG** — Charts, gauges, network map — all declarative

**No runtime dependencies beyond Vue.**

---

## 📄 License

MIT — built by [Rujuta Ekhande](https://github.com/One-Of-The-Ekhandes)
