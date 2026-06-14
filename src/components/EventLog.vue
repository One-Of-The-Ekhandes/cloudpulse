<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { SecurityEvent, Severity, EventCategory, FilterState } from '../types';
import { SEVERITY_COLORS, SEVERITY_ORDER, CATEGORY_LABELS } from '../types';
import { useVirtualScroll } from '../composables/useVirtualScroll';

const props = defineProps<{
  events: SecurityEvent[];
}>();

const emit = defineEmits<{
  resolve: [id: string];
}>();

const filter = ref<FilterState>({
  search: '',
  severities: new Set(SEVERITY_ORDER),
  categories: new Set(Object.keys(CATEGORY_LABELS) as EventCategory[]),
});

const expandedId = ref<string | null>(null);

const filteredEvents = computed(() => {
  return props.events.filter((e) => {
    if (!filter.value.severities.has(e.severity)) return false;
    if (!filter.value.categories.has(e.category)) return false;
    if (filter.value.search) {
      const q = filter.value.search.toLowerCase();
      return (
        e.message.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        e.destination.toLowerCase().includes(q)
      );
    }
    return true;
  });
});

const ITEM_HEIGHT = 52;
const CONTAINER_HEIGHT = 450;

const { containerRef, totalHeight, visibleItems, onScroll } =
  useVirtualScroll({
    items: filteredEvents,
    itemHeight: ITEM_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    overscan: 8,
  });

function toggleSeverity(s: Severity) {
  const next = new Set(filter.value.severities);
  if (next.has(s)) next.delete(s);
  else next.add(s);
  filter.value = { ...filter.value, severities: next };
}

function toggleCategory(c: EventCategory) {
  const next = new Set(filter.value.categories);
  if (next.has(c)) next.delete(c);
  else next.add(c);
  filter.value = { ...filter.value, categories: next };
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-GB', { hour12: false });
}

function formatAge(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

// Auto-refresh age display
const now = ref(Date.now());
let ageTimer: ReturnType<typeof setInterval> | null = null;
watch(
  () => props.events.length,
  () => {
    if (!ageTimer) {
      ageTimer = setInterval(() => { now.value = Date.now(); }, 5000);
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="event-log">
    <div class="log-header">
      <h3 class="log-title">
        Security Events
        <span class="event-count">{{ filteredEvents.length }} / {{ events.length }}</span>
      </h3>

      <!-- Search -->
      <input
        v-model="filter.search"
        type="text"
        placeholder="Search events..."
        class="search-input"
      />
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">Severity:</span>
        <button
          v-for="s in SEVERITY_ORDER"
          :key="s"
          class="filter-chip"
          :class="{ active: filter.severities.has(s) }"
          :style="filter.severities.has(s) ? { borderColor: SEVERITY_COLORS[s], color: SEVERITY_COLORS[s] } : {}"
          @click="toggleSeverity(s)"
        >{{ s }}</button>
      </div>
      <div class="filter-group">
        <span class="filter-label">Category:</span>
        <button
          v-for="(label, key) in CATEGORY_LABELS"
          :key="key"
          class="filter-chip"
          :class="{ active: filter.categories.has(key) }"
          @click="toggleCategory(key)"
        >{{ label }}</button>
      </div>
    </div>

    <!-- Virtual scroll container -->
    <div
      ref="containerRef"
      class="scroll-container"
      :style="{ height: CONTAINER_HEIGHT + 'px' }"
      @scroll="onScroll"
    >
      <div :style="{ height: totalHeight + 'px', position: 'relative' }">
        <div
          v-for="{ item: event, offsetTop } in visibleItems"
          :key="event.id"
          class="event-row"
          :class="{ resolved: event.resolved, expanded: expandedId === event.id }"
          :style="{ position: 'absolute', top: offsetTop + 'px', width: '100%', height: ITEM_HEIGHT + 'px' }"
          @click="toggleExpand(event.id)"
        >
          <span
            class="severity-badge"
            :style="{ backgroundColor: SEVERITY_COLORS[event.severity] }"
          >{{ event.severity.charAt(0).toUpperCase() }}</span>

          <span class="event-time">{{ formatTime(event.timestamp) }}</span>
          <span class="event-source">{{ event.source }}</span>
          <span class="event-message">{{ event.message }}</span>
          <span class="event-age">{{ formatAge(event.timestamp) }}</span>

          <button
            v-if="!event.resolved"
            class="resolve-btn"
            @click.stop="emit('resolve', event.id)"
            title="Resolve"
          >✓</button>
          <span v-else class="resolved-badge">Resolved</span>
        </div>
      </div>
    </div>

    <!-- Expanded detail panel -->
    <Transition name="slide">
      <div v-if="expandedId" class="detail-panel">
        <template v-for="event in [events.find(e => e.id === expandedId)]" :key="expandedId">
          <div v-if="event" class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">ID</span>
              <span class="detail-value mono">{{ event.id }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Category</span>
              <span class="detail-value">{{ CATEGORY_LABELS[event.category] }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Source</span>
              <span class="detail-value mono">{{ event.source }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Destination</span>
              <span class="detail-value mono">{{ event.destination }}</span>
            </div>
            <div v-for="(val, key) in event.metadata" :key="key" class="detail-item">
              <span class="detail-label">{{ key }}</span>
              <span class="detail-value mono">{{ val }}</span>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.event-log {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.log-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.event-count {
  font-weight: 400;
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 8px;
}

.search-input {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-primary);
  outline: none;
  min-width: 200px;
}

.search-input:focus {
  border-color: #7c3aed;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 65px;
}

.filter-chip {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  text-transform: capitalize;
  transition: all 0.15s;
}

.filter-chip.active {
  background: var(--bg);
  color: var(--text-primary);
  border-color: var(--text-secondary);
}

.scroll-container {
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.scroll-container::-webkit-scrollbar {
  width: 6px;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.event-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.1s;
  box-sizing: border-box;
}

.event-row:hover {
  background: var(--hover-bg);
}

.event-row.resolved {
  opacity: 0.5;
}

.severity-badge {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.event-time {
  font-size: 11px;
  font-family: 'Courier New', monospace;
  color: var(--text-secondary);
  flex-shrink: 0;
  min-width: 65px;
}

.event-source {
  font-size: 11px;
  color: #7c3aed;
  min-width: 100px;
  flex-shrink: 0;
  font-weight: 500;
}

.event-message {
  font-size: 12px;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-age {
  font-size: 10px;
  color: var(--text-secondary);
  min-width: 50px;
  text-align: right;
  flex-shrink: 0;
}

.resolve-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #22c55e;
  background: transparent;
  color: #22c55e;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.resolve-btn:hover {
  background: #22c55e;
  color: white;
}

.resolved-badge {
  font-size: 10px;
  color: #22c55e;
  font-weight: 500;
}

.detail-panel {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 13px;
  color: var(--text-primary);
}

.mono {
  font-family: 'Courier New', monospace;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
