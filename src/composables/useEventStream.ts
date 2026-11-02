/**
 * useEventStream — Simulated real-time security event generator.
 *
 * Generates realistic cloud security events at configurable intervals,
 * maintaining a rolling window of threat metrics for charting.
 * Events are randomised with Math.random(), so each session shows a different stream.
 */
import { ref, computed, onUnmounted, type Ref } from 'vue';
import type { SecurityEvent, Severity, EventCategory, ThreatMetric } from '../types';

const SOURCES = [
  'web-server-01', 'web-server-02', 'api-gateway', 'db-primary',
  'db-replica', 'auth-service', 'cdn-edge-01', 'load-balancer',
  'cache-redis-01', 'worker-queue', 'firewall-ext', 'vpn-gateway',
  'storage-s3', 'lambda-proc-01', 'monitor-agent',
];

const DESTINATIONS = [
  '10.0.1.15', '10.0.2.30', '10.0.3.45', '192.168.1.100',
  '172.16.0.50', '8.8.8.8', '1.1.1.1', '203.0.113.42',
  '198.51.100.17', '10.0.4.60',
];

const MESSAGE_TEMPLATES: Record<EventCategory, string[]> = {
  authentication: [
    'Failed login attempt from {src} — {n} attempts in last 5min',
    'Brute force detected on {dst} from {src}',
    'MFA bypass attempt blocked for user admin@{src}',
    'Session token expired and reused from {src}',
    'Privilege escalation attempt detected on {dst}',
  ],
  network: [
    'Unusual outbound traffic spike from {src} to {dst} ({n}MB)',
    'Port scan detected from {src} targeting {dst}',
    'DDoS pattern identified — {n} req/s from {src}',
    'DNS tunneling attempt from {src}',
    'Lateral movement detected: {src} → {dst}',
  ],
  data_access: [
    'Bulk data export triggered on {dst} by {src}',
    'Unauthorized API call to /admin/export from {src}',
    'Sensitive PII accessed outside business hours from {src}',
    'Database query anomaly on {dst} — {n} rows returned',
    'S3 bucket policy changed on {dst}',
  ],
  configuration: [
    'Security group modified on {dst} — port 22 opened',
    'IAM policy attached with wildcard permissions on {src}',
    'SSL certificate expiring in {n} days on {dst}',
    'Firewall rule deleted on {src}',
    'Root account accessed directly from {src}',
  ],
  malware: [
    'Suspicious binary executed on {src} — hash: {hash}',
    'Ransomware signature detected in traffic from {src}',
    'C2 beacon pattern identified from {src} to {dst}',
    'Cryptominer process detected on {src}',
    'Malicious payload dropped on {dst} via {src}',
  ],
  policy_violation: [
    'Unencrypted data transfer from {src} to {dst}',
    'Non-compliant resource deployed on {dst}',
    'Access from blocked geography: {src}',
    'Password policy violation on {src}',
    'Data retention policy breach on {dst} — {n} days overdue',
  ],
};

let eventCounter = 0;

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateHash(): string {
  return Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateEvent(): SecurityEvent {
  const categories: EventCategory[] = [
    'authentication', 'network', 'data_access',
    'configuration', 'malware', 'policy_violation',
  ];
  const severities: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
  const weights = [0.05, 0.15, 0.3, 0.3, 0.2]; // realistic distribution

  // Weighted severity selection
  const roll = Math.random();
  let cumulative = 0;
  let severity: Severity = 'info';
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) {
      severity = severities[i];
      break;
    }
  }

  const category = randomFrom(categories);
  const source = randomFrom(SOURCES);
  const destination = randomFrom(DESTINATIONS);
  const templates = MESSAGE_TEMPLATES[category];
  const template = randomFrom(templates);

  const message = template
    .replace('{src}', source)
    .replace('{dst}', destination)
    .replace('{n}', String(Math.floor(Math.random() * 500) + 1))
    .replace('{hash}', generateHash());

  return {
    id: `evt-${++eventCounter}-${Date.now()}`,
    timestamp: Date.now(),
    severity,
    category,
    source,
    destination,
    message,
    resolved: false,
    metadata: {
      region: randomFrom(['us-east-1', 'eu-west-1', 'ap-northeast-1', 'us-west-2']),
      protocol: randomFrom(['TCP', 'UDP', 'HTTPS', 'SSH', 'DNS']),
      bytes: Math.floor(Math.random() * 100000),
    },
  };
}

export function useEventStream(intervalMs: Ref<number> = ref(1500)) {
  const events = ref<SecurityEvent[]>([]);
  const isStreaming = ref(false);
  const metrics = ref<ThreatMetric[]>([]);
  let timer: ReturnType<typeof setInterval> | null = null;
  let metricsTimer: ReturnType<typeof setInterval> | null = null;

  const totalEvents = computed(() => events.value.length);

  const severityCounts = computed(() => {
    const counts: Record<Severity, number> = {
      critical: 0, high: 0, medium: 0, low: 0, info: 0,
    };
    for (const e of events.value) {
      counts[e.severity]++;
    }
    return counts;
  });

  const threatScore = computed(() => {
    const c = severityCounts.value;
    const score = c.critical * 40 + c.high * 20 + c.medium * 10 + c.low * 3 + c.info * 1;
    return Math.min(100, Math.round(score / Math.max(totalEvents.value, 1)));
  });

  function pushEvent() {
    const event = generateEvent();
    events.value = [event, ...events.value].slice(0, 2000); // rolling window
  }

  function snapshotMetrics() {
    const recent = events.value.filter(
      (e) => Date.now() - e.timestamp < 30000
    );
    const metric: ThreatMetric = {
      timestamp: Date.now(),
      critical: 0, high: 0, medium: 0, low: 0, info: 0,
    };
    for (const e of recent) {
      metric[e.severity]++;
    }
    metrics.value = [...metrics.value, metric].slice(-30); // keep 30 data points
  }

  function start() {
    if (isStreaming.value) return;
    isStreaming.value = true;
    // Seed initial events
    for (let i = 0; i < 25; i++) pushEvent();
    snapshotMetrics();

    timer = setInterval(pushEvent, intervalMs.value);
    metricsTimer = setInterval(snapshotMetrics, 3000);
  }

  function stop() {
    isStreaming.value = false;
    if (timer) clearInterval(timer);
    if (metricsTimer) clearInterval(metricsTimer);
    timer = null;
    metricsTimer = null;
  }

  function resolveEvent(id: string) {
    const idx = events.value.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const updated = { ...events.value[idx], resolved: true };
      events.value = [
        ...events.value.slice(0, idx),
        updated,
        ...events.value.slice(idx + 1),
      ];
    }
  }

  function clearEvents() {
    events.value = [];
    metrics.value = [];
  }

  onUnmounted(stop);

  return {
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
  };
}
