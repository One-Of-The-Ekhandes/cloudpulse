<script setup lang="ts">
import { ref } from 'vue';
import StatusBar from './components/StatusBar.vue';
import ThreatChart from './components/ThreatChart.vue';
import EventLog from './components/EventLog.vue';
import NetworkMap from './components/NetworkMap.vue';
import { useEventStream } from './composables/useEventStream';
import { useTheme } from './composables/useTheme';
import { useKeyboard } from './composables/useKeyboard';

const {
  events,
  metrics,
  isStreaming,
  totalEvents,
  severityCounts,
  threatScore,
  start,
  stop,
  resolveEvent,
  clearEvents,
} = useEventStream();

const { theme, toggle: toggleTheme } = useTheme();
const showShortcuts = ref(false);

const { bindings } = useKeyboard([
  { key: 's', description: 'Start/stop event stream', handler: () => isStreaming.value ? stop() : start() },
  { key: 't', description: 'Toggle dark/light theme', handler: toggleTheme },
  { key: 'c', description: 'Clear all events', handler: clearEvents },
  { key: '?', shift: true, description: 'Show keyboard shortcuts', handler: () => showShortcuts.value = !showShortcuts.value },
]);

start();
</script>

<template>
  <div class="app" :class="theme">
    <header class="header">
      <div class="header-left">
        <h1 class="logo"><span class="logo-icon">◈</span> CloudPulse</h1>
        <span class="tagline">Real-time Security Monitoring</span>
      </div>
      <div class="header-right">
        <button class="header-btn" @click="isStreaming ? stop() : start()">
          {{ isStreaming ? '⏸ Pause' : '▶ Start' }}
        </button>
        <button class="header-btn" @click="clearEvents">🗑 Clear</button>
        <button class="header-btn" @click="toggleTheme">
          {{ theme === 'dark' ? '☀️' : '🌙' }}
        </button>
        <button class="header-btn" @click="showShortcuts = !showShortcuts">⌨️</button>
      </div>
    </header>

    <Transition name="fade">
      <div v-if="showShortcuts" class="modal-overlay" @click="showShortcuts = false">
        <div class="modal" @click.stop>
          <h3>Keyboard Shortcuts</h3>
          <div v-for="b in bindings" :key="b.key" class="shortcut-row">
            <kbd>{{ b.shift ? 'Shift + ' : '' }}{{ b.key.toUpperCase() }}</kbd>
            <span>{{ b.description }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <main class="dashboard">
      <section class="top-row">
        <StatusBar
          :severity-counts="severityCounts"
          :total-events="totalEvents"
          :threat-score="threatScore"
          :is-streaming="isStreaming"
        />
      </section>
      <section class="charts-row">
        <ThreatChart :metrics="metrics" />
        <NetworkMap :threat-score="threatScore" />
      </section>
      <section class="events-row">
        <EventLog :events="events" @resolve="resolveEvent" />
      </section>
    </main>

    <footer class="footer">
      <span>CloudPulse v1.0 — Vue 3 + TypeScript — Zero external dependencies</span>
      <span>Press <kbd>?</kbd> for shortcuts</span>
    </footer>
  </div>
</template>

<style>
:root, [data-theme='dark'] {
  --bg: #0f1117;
  --card-bg: #1a1d27;
  --border: #2a2d3a;
  --text-primary: #e4e4e7;
  --text-secondary: #71717a;
  --hover-bg: #22252f;
  --accent: #7c3aed;
}
[data-theme='light'] {
  --bg: #f8f9fc;
  --card-bg: #ffffff;
  --border: #e4e4e7;
  --text-primary: #18181b;
  --text-secondary: #71717a;
  --hover-bg: #f4f4f5;
  --accent: #7c3aed;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
.header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 24px; border-bottom: 1px solid var(--border);
  background: var(--card-bg); position: sticky; top: 0; z-index: 100;
}
.header-left { display: flex; align-items: baseline; gap: 12px; }
.logo { font-size: 20px; font-weight: 700; color: var(--accent); }
.logo-icon { font-size: 22px; }
.tagline { font-size: 12px; color: var(--text-secondary); }
.header-right { display: flex; gap: 8px; }
.header-btn {
  padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border);
  background: var(--bg); color: var(--text-primary); font-size: 12px;
  cursor: pointer; transition: all 0.15s;
}
.header-btn:hover { border-color: var(--accent); color: var(--accent); }
.dashboard {
  flex: 1; padding: 20px 24px; display: flex; flex-direction: column;
  gap: 16px; max-width: 1400px; width: 100%; margin: 0 auto;
}
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.footer {
  display: flex; justify-content: space-between; padding: 10px 24px;
  border-top: 1px solid var(--border); font-size: 11px; color: var(--text-secondary);
}
.footer kbd {
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 3px; padding: 1px 4px; font-size: 10px;
}
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.modal {
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 12px; padding: 24px; min-width: 320px;
}
.modal h3 { margin-bottom: 16px; font-size: 16px; }
.shortcut-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 13px;
}
.shortcut-row kbd {
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 4px; padding: 2px 8px; font-size: 12px; font-family: monospace;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 900px) {
  .charts-row { grid-template-columns: 1fr; }
  .header { flex-direction: column; gap: 8px; }
}
</style>
