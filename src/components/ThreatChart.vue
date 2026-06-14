<script setup lang="ts">
import { computed } from 'vue';
import type { ThreatMetric } from '../types';
import { SEVERITY_COLORS, SEVERITY_ORDER } from '../types';

const props = defineProps<{
  metrics: ThreatMetric[];
  width?: number;
  height?: number;
}>();

const W = computed(() => props.width ?? 700);
const H = computed(() => props.height ?? 220);
const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };

const chartW = computed(() => W.value - PADDING.left - PADDING.right);
const chartH = computed(() => H.value - PADDING.top - PADDING.bottom);

const maxValue = computed(() => {
  let max = 1;
  for (const m of props.metrics) {
    const total = m.critical + m.high + m.medium + m.low + m.info;
    if (total > max) max = total;
  }
  return max;
});

const yTicks = computed(() => {
  const max = maxValue.value;
  const step = Math.ceil(max / 4);
  const ticks: number[] = [];
  for (let i = 0; i <= max; i += step) ticks.push(i);
  return ticks;
});

function getAreaPath(severity: keyof ThreatMetric): string {
  if (props.metrics.length < 2) return '';
  const points = props.metrics.map((m, i) => {
    const x = PADDING.left + (i / (props.metrics.length - 1)) * chartW.value;
    // Stack: sum of all severities below this one
    let y = 0;
    const order = SEVERITY_ORDER;
    const idx = order.indexOf(severity as any);
    for (let j = idx; j < order.length; j++) {
      y += m[order[j] as keyof ThreatMetric] as number;
    }
    const yPos = PADDING.top + chartH.value - (y / maxValue.value) * chartH.value;
    return `${x},${yPos}`;
  });

  // Bottom edge points for area fill
  const bottomPoints = props.metrics.map((_, i) => {
    const x = PADDING.left + (i / (props.metrics.length - 1)) * chartW.value;
    let y = 0;
    const order = SEVERITY_ORDER;
    const idx = order.indexOf(severity as any);
    for (let j = idx + 1; j < order.length; j++) {
      y += props.metrics[i][order[j] as keyof ThreatMetric] as number;
    }
    const yPos = PADDING.top + chartH.value - (y / maxValue.value) * chartH.value;
    return `${x},${yPos}`;
  }).reverse();

  return `M${points.join(' L')} L${bottomPoints.join(' L')} Z`;
}

function getLinePath(severity: keyof ThreatMetric): string {
  if (props.metrics.length < 2) return '';
  const points = props.metrics.map((m, i) => {
    const x = PADDING.left + (i / (props.metrics.length - 1)) * chartW.value;
    let y = 0;
    const order = SEVERITY_ORDER;
    const idx = order.indexOf(severity as any);
    for (let j = idx; j < order.length; j++) {
      y += m[order[j] as keyof ThreatMetric] as number;
    }
    const yPos = PADDING.top + chartH.value - (y / maxValue.value) * chartH.value;
    return `${x},${yPos}`;
  });
  return `M${points.join(' L')}`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}
</script>

<template>
  <div class="chart-container">
    <h3 class="chart-title">Threat Activity Timeline</h3>
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      :width="W"
      :height="H"
      class="chart-svg"
    >
      <!-- Grid lines -->
      <line
        v-for="tick in yTicks"
        :key="tick"
        :x1="PADDING.left"
        :x2="PADDING.left + chartW"
        :y1="PADDING.top + chartH - (tick / maxValue) * chartH"
        :y2="PADDING.top + chartH - (tick / maxValue) * chartH"
        class="grid-line"
      />

      <!-- Y axis labels -->
      <text
        v-for="tick in yTicks"
        :key="'label-' + tick"
        :x="PADDING.left - 8"
        :y="PADDING.top + chartH - (tick / maxValue) * chartH + 4"
        class="axis-label"
        text-anchor="end"
      >{{ tick }}</text>

      <!-- Stacked area charts -->
      <path
        v-for="severity in SEVERITY_ORDER"
        :key="severity"
        :d="getAreaPath(severity)"
        :fill="SEVERITY_COLORS[severity]"
        fill-opacity="0.3"
        class="area-path"
      />
      <path
        v-for="severity in SEVERITY_ORDER"
        :key="'line-' + severity"
        :d="getLinePath(severity)"
        :stroke="SEVERITY_COLORS[severity]"
        stroke-width="2"
        fill="none"
        class="line-path"
      />

      <!-- X axis time labels -->
      <template v-if="metrics.length > 1">
        <text
          :x="PADDING.left"
          :y="H - 5"
          class="axis-label"
          text-anchor="start"
        >{{ formatTime(metrics[0]?.timestamp ?? 0) }}</text>
        <text
          :x="PADDING.left + chartW"
          :y="H - 5"
          class="axis-label"
          text-anchor="end"
        >{{ formatTime(metrics[metrics.length - 1]?.timestamp ?? 0) }}</text>
      </template>

      <!-- Axes -->
      <line
        :x1="PADDING.left" :y1="PADDING.top"
        :x2="PADDING.left" :y2="PADDING.top + chartH"
        class="axis-line"
      />
      <line
        :x1="PADDING.left" :y1="PADDING.top + chartH"
        :x2="PADDING.left + chartW" :y2="PADDING.top + chartH"
        class="axis-line"
      />
    </svg>

    <!-- Legend -->
    <div class="legend">
      <span v-for="s in SEVERITY_ORDER" :key="s" class="legend-item">
        <span class="legend-dot" :style="{ backgroundColor: SEVERITY_COLORS[s] }"></span>
        {{ s }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}
.chart-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}
.chart-svg {
  width: 100%;
  height: auto;
}
.grid-line {
  stroke: var(--border);
  stroke-dasharray: 4 4;
  stroke-width: 0.5;
}
.axis-label {
  font-size: 10px;
  fill: var(--text-secondary);
}
.axis-line {
  stroke: var(--border);
  stroke-width: 1;
}
.area-path {
  transition: d 0.3s ease;
}
.line-path {
  transition: d 0.3s ease;
}
.legend {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  text-transform: capitalize;
  color: var(--text-secondary);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
