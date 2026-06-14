<script setup lang="ts">
import { computed } from 'vue';
import type { Severity } from '../types';
import { SEVERITY_COLORS } from '../types';

const props = defineProps<{
  severityCounts: Record<Severity, number>;
  totalEvents: number;
  threatScore: number;
  isStreaming: boolean;
}>();

const scoreColor = computed(() => {
  if (props.threatScore >= 70) return SEVERITY_COLORS.critical;
  if (props.threatScore >= 50) return SEVERITY_COLORS.high;
  if (props.threatScore >= 30) return SEVERITY_COLORS.medium;
  return SEVERITY_COLORS.low;
});

const scoreLabel = computed(() => {
  if (props.threatScore >= 70) return 'CRITICAL';
  if (props.threatScore >= 50) return 'HIGH';
  if (props.threatScore >= 30) return 'ELEVATED';
  return 'NORMAL';
});

// SVG donut chart for threat score
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const strokeDashoffset = computed(
  () => CIRCUMFERENCE - (props.threatScore / 100) * CIRCUMFERENCE
);
</script>

<template>
  <div class="status-bar">
    <!-- Threat Score Gauge -->
    <div class="gauge-card">
      <svg viewBox="0 0 100 100" class="gauge-svg">
        <circle
          cx="50" cy="50" :r="RADIUS"
          fill="none"
          stroke="var(--border)"
          stroke-width="8"
        />
        <circle
          cx="50" cy="50" :r="RADIUS"
          fill="none"
          :stroke="scoreColor"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="strokeDashoffset"
          transform="rotate(-90 50 50)"
          class="gauge-progress"
        />
        <text x="50" y="46" text-anchor="middle" class="gauge-value">
          {{ threatScore }}
        </text>
        <text x="50" y="60" text-anchor="middle" class="gauge-label">
          {{ scoreLabel }}
        </text>
      </svg>
      <span class="card-label">Threat Score</span>
    </div>

    <!-- Stats Cards -->
    <div class="stat-card">
      <div class="stat-value">{{ totalEvents.toLocaleString() }}</div>
      <div class="stat-label">Total Events</div>
      <div class="stat-stream" :class="{ active: isStreaming }">
        <span class="dot"></span>
        {{ isStreaming ? 'LIVE' : 'PAUSED' }}
      </div>
    </div>

    <div class="severity-cards">
      <div
        v-for="(count, severity) in severityCounts"
        :key="severity"
        class="sev-card"
      >
        <span class="sev-dot" :style="{ backgroundColor: SEVERITY_COLORS[severity as Severity] }"></span>
        <span class="sev-count">{{ count }}</span>
        <span class="sev-label">{{ severity }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  gap: 16px;
  align-items: stretch;
  flex-wrap: wrap;
}

.gauge-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.gauge-svg {
  width: 100px;
  height: 100px;
}

.gauge-progress {
  transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;
}

.gauge-value {
  font-size: 20px;
  font-weight: 700;
  fill: var(--text-primary);
}

.gauge-label {
  font-size: 8px;
  font-weight: 600;
  fill: var(--text-secondary);
  letter-spacing: 1px;
}

.card-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 120px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-stream {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 1px;
}

.stat-stream.active {
  color: #22c55e;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
}

.stat-stream.active .dot {
  background: #22c55e;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.severity-cards {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  justify-content: center;
  flex: 1;
}

.sev-card {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sev-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sev-count {
  font-weight: 700;
  font-size: 14px;
  min-width: 30px;
  color: var(--text-primary);
}

.sev-label {
  font-size: 12px;
  text-transform: capitalize;
  color: var(--text-secondary);
}
</style>
