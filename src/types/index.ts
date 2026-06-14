/** CloudPulse — Type System */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type EventCategory =
  | 'authentication'
  | 'network'
  | 'data_access'
  | 'configuration'
  | 'malware'
  | 'policy_violation';

export interface SecurityEvent {
  id: string;
  timestamp: number;
  severity: Severity;
  category: EventCategory;
  source: string;
  destination: string;
  message: string;
  resolved: boolean;
  metadata: Record<string, string | number>;
}

export interface ThreatMetric {
  timestamp: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface NetworkNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'server' | 'firewall' | 'database' | 'client' | 'cloud';
  status: 'healthy' | 'warning' | 'critical';
  connections: string[];
}

export interface FilterState {
  search: string;
  severities: Set<Severity>;
  categories: Set<EventCategory>;
}

export interface ChartPoint {
  x: number;
  y: number;
  value: number;
  label: string;
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#6b7280',
};

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  authentication: 'Authentication',
  network: 'Network',
  data_access: 'Data Access',
  configuration: 'Configuration',
  malware: 'Malware',
  policy_violation: 'Policy Violation',
};
