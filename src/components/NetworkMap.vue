<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { NetworkNode } from '../types';

const props = defineProps<{
  threatScore: number;
}>();

const WIDTH = 650;
const HEIGHT = 350;

const nodes = ref<NetworkNode[]>([
  { id: 'internet', label: 'Internet', x: 60, y: 175, type: 'cloud', status: 'healthy', connections: ['firewall'] },
  { id: 'firewall', label: 'Firewall', x: 180, y: 175, type: 'firewall', status: 'healthy', connections: ['lb'] },
  { id: 'lb', label: 'Load Balancer', x: 310, y: 175, type: 'server', status: 'healthy', connections: ['web1', 'web2', 'api'] },
  { id: 'web1', label: 'Web Server 1', x: 440, y: 80, type: 'server', status: 'healthy', connections: ['db'] },
  { id: 'web2', label: 'Web Server 2', x: 440, y: 175, type: 'server', status: 'healthy', connections: ['db'] },
  { id: 'api', label: 'API Gateway', x: 440, y: 270, type: 'server', status: 'healthy', connections: ['db', 'cache'] },
  { id: 'db', label: 'Database', x: 580, y: 130, type: 'database', status: 'healthy', connections: [] },
  { id: 'cache', label: 'Redis Cache', x: 580, y: 250, type: 'database', status: 'healthy', connections: [] },
]);

const hoveredNode = ref<string | null>(null);

// Simulate status changes based on threat score
let statusTimer: ReturnType<typeof setInterval> | null = null;

function updateStatuses() {
  nodes.value = nodes.value.map((node) => {
    const roll = Math.random() * 100;
    let status: NetworkNode['status'] = 'healthy';
    if (roll < props.threatScore * 0.4) status = 'warning';
    if (roll < props.threatScore * 0.15) status = 'critical';
    return { ...node, status };
  });
}

onMounted(() => {
  statusTimer = setInterval(updateStatuses, 4000);
});

onUnmounted(() => {
  if (statusTimer) clearInterval(statusTimer);
});

const STATUS_COLORS = {
  healthy: '#22c55e',
  warning: '#eab308',
  critical: '#ef4444',
};

const NODE_ICONS: Record<NetworkNode['type'], string> = {
  server: '🖥️',
  firewall: '🛡️',
  database: '🗄️',
  client: '💻',
  cloud: '☁️',
};

function getNodeById(id: string) {
  return nodes.value.find((n) => n.id === id);
}

const connections = computed(() => {
  const conns: { from: NetworkNode; to: NetworkNode }[] = [];
  for (const node of nodes.value) {
    for (const targetId of node.connections) {
      const target = getNodeById(targetId);
      if (target) conns.push({ from: node, to: target });
    }
  }
  return conns;
});
</script>

<template>
  <div class="network-map">
    <h3 class="map-title">Network Topology</h3>
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="map-svg">
      <!-- Connection lines -->
      <line
        v-for="(conn, i) in connections"
        :key="'conn-' + i"
        :x1="conn.from.x"
        :y1="conn.from.y"
        :x2="conn.to.x"
        :y2="conn.to.y"
        class="connection-line"
        :class="{
          warning: conn.from.status !== 'healthy' || conn.to.status !== 'healthy',
          critical: conn.from.status === 'critical' || conn.to.status === 'critical',
        }"
      />

      <!-- Animated data packets along connections -->
      <circle
        v-for="(conn, i) in connections"
        :key="'packet-' + i"
        r="3"
        :fill="STATUS_COLORS[conn.from.status]"
        opacity="0.8"
      >
        <animateMotion
          :dur="(2 + Math.random() * 2).toFixed(1) + 's'"
          repeatCount="indefinite"
        >
          <mpath>
            <line :x1="conn.from.x" :y1="conn.from.y" :x2="conn.to.x" :y2="conn.to.y" />
          </mpath>
        </animateMotion>
      </circle>

      <!-- Nodes -->
      <g
        v-for="node in nodes"
        :key="node.id"
        class="node-group"
        @mouseenter="hoveredNode = node.id"
        @mouseleave="hoveredNode = null"
      >
        <!-- Status ring -->
        <circle
          :cx="node.x"
          :cy="node.y"
          r="25"
          :fill="STATUS_COLORS[node.status]"
          :opacity="node.status === 'critical' ? 0.2 : 0.1"
          class="status-ring"
          :class="{ critical: node.status === 'critical' }"
        />

        <!-- Node circle -->
        <circle
          :cx="node.x"
          :cy="node.y"
          r="18"
          :fill="'var(--card-bg)'"
          :stroke="STATUS_COLORS[node.status]"
          stroke-width="2"
          class="node-circle"
        />

        <!-- Node icon -->
        <text
          :x="node.x"
          :y="node.y + 5"
          text-anchor="middle"
          font-size="14"
        >{{ NODE_ICONS[node.type] }}</text>

        <!-- Node label -->
        <text
          :x="node.x"
          :y="node.y + 38"
          text-anchor="middle"
          class="node-label"
        >{{ node.label }}</text>

        <!-- Status indicator -->
        <circle
          :cx="node.x + 14"
          :cy="node.y - 14"
          r="5"
          :fill="STATUS_COLORS[node.status]"
          stroke="var(--card-bg)"
          stroke-width="2"
        />

        <!-- Tooltip on hover -->
        <g v-if="hoveredNode === node.id">
          <rect
            :x="node.x - 55"
            :y="node.y - 55"
            width="110"
            height="24"
            rx="4"
            fill="var(--text-primary)"
            opacity="0.9"
          />
          <text
            :x="node.x"
            :y="node.y - 39"
            text-anchor="middle"
            fill="var(--bg)"
            font-size="10"
            font-weight="600"
          >{{ node.status.toUpperCase() }} — {{ node.type }}</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.network-map {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}

.map-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.map-svg {
  width: 100%;
  height: auto;
}

.connection-line {
  stroke: var(--border);
  stroke-width: 1.5;
  transition: stroke 0.3s;
}

.connection-line.warning {
  stroke: #eab308;
  stroke-dasharray: 6 3;
}

.connection-line.critical {
  stroke: #ef4444;
  stroke-dasharray: 4 2;
  animation: dash 1s linear infinite;
}

@keyframes dash {
  to { stroke-dashoffset: -12; }
}

.node-group {
  cursor: pointer;
}

.node-circle {
  transition: stroke 0.3s, r 0.15s;
}

.node-group:hover .node-circle {
  filter: brightness(1.1);
}

.status-ring.critical {
  animation: ring-pulse 1.5s ease infinite;
}

@keyframes ring-pulse {
  0%, 100% { opacity: 0.2; r: 25; }
  50% { opacity: 0.4; r: 30; }
}

.node-label {
  font-size: 9px;
  fill: var(--text-secondary);
  font-weight: 500;
}
</style>
