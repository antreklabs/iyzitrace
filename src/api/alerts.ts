// Alerts API Service
// Bu dosya gerçek API endpoint'leri ile entegrasyon için hazırlanmıştır

export type TimeRange = '1h' | '6h' | '1d' | '7d';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  expression: string;
  enabled: boolean;
  thresholds: {
    critical?: number;
    warning?: number;
    degraded?: number;
  };
  category: string;
  technology: string;
}

export interface FailedCheck {
  id: string;
  status: 'CRITICAL' | 'WARNING' | 'DEGRADED';
  resource: string;
  summary: string;
  ruleName: string;
  timestamp: string;
  attributes: Record<string, any>;
}

export interface TimelineData {
  time: string;
  status: 'critical' | 'warning' | 'degraded' | 'healthy' | 'no-data';
  count: number;
}

// Gerçek API fonksiyonları (production için)
const alertsApi = {
  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const response = await fetch('http://localhost:3000/api/alerts/rules');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching alert rules:', error);
      throw error;
    }
  },

  async getFailedChecks(timeRange: TimeRange): Promise<FailedCheck[]> {
    try {
      const response = await fetch(`http://localhost:3000/api/alerts/failed-checks?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching failed checks:', error);
      throw error;
    }
  },

  async getTimelineData(timeRange: TimeRange): Promise<TimelineData[]> {
    try {
      const response = await fetch(`http://localhost:3000/api/alerts/timeline?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching timeline data:', error);
      throw error;
    }
  },

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/api/alerts/rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating alert rule:', error);
      throw error;
    }
  },
};

// Mock data (development için)
export const mockAlertsData = {
  alertRules: [
    {
      id: '1',
      name: 'OTEL Collector export failures',
      description: 'Monitors OpenTelemetry Collector metric export failure rate over 5 minutes. This alert fires when the rate of failed metric exports exceeds the threshold:',
      expression: 'rate({otel_metric_name="otelcol_exporter_send_failed_metric_points_total"}[5m]) > $__threshold',
      enabled: true,
      thresholds: {
        critical: 10,
        warning: 5,
      },
      category: 'Observability Pipelines',
      technology: 'OpenTelemetry Collector',
    },
    {
      id: '2',
      name: 'OTEL Collector high memory usage',
      description: 'Monitors OpenTelemetry Collector memory usage',
      expression: 'otelcol_memory_usage > $__threshold',
      enabled: true,
      thresholds: {
        critical: 80,
        warning: 60,
      },
      category: 'Observability Pipelines',
      technology: 'OpenTelemetry Collector',
    },
    {
      id: '3',
      name: 'OTEL Collector log export failures',
      description: 'Monitors OpenTelemetry Collector log export failure rate',
      expression: 'rate({otel_metric_name="otelcol_exporter_send_failed_log_records_total"}[5m]) > $__threshold',
      enabled: false,
      thresholds: {
        critical: 5,
        warning: 2,
      },
      category: 'Observability Pipelines',
      technology: 'OpenTelemetry Collector',
    },
    {
      id: '4',
      name: 'Go high allocation rate',
      description: 'Monitors Go application memory allocation rate',
      expression: 'rate(go_memstats_alloc_bytes_total[5m]) > $__threshold',
      enabled: true,
      thresholds: {
        critical: 2,
        warning: 1,
      },
      category: 'Technologies',
      technology: 'Go',
    },
    {
      id: '5',
      name: 'Database connection pool exhausted',
      description: 'Monitors database connection pool usage',
      expression: 'db_connections_active / db_connections_max > $__threshold',
      enabled: true,
      thresholds: {
        critical: 0.9,
        warning: 0.7,
      },
      category: 'Technologies',
      technology: 'Database',
    },
    {
      id: '6',
      name: 'Service response time high',
      description: 'Monitors service response time',
      expression: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > $__threshold',
      enabled: false,
      thresholds: {
        critical: 1.0,
        warning: 0.5,
      },
      category: 'Services',
      technology: 'HTTP',
    },
  ] as AlertRule[],

  failedChecks: [
    {
      id: '1',
      status: 'CRITICAL' as const,
      resource: 'Container 44c848ad8d18d1a2b850447821057c3...',
      summary: 'Go high allocation rate',
      ruleName: 'Go high allocation rate Version 1',
      timestamp: '2024-01-15T18:18:05Z',
      attributes: {
        'dash0.resource.name': 'opentelemetry-demo:flagd',
        'dash0.resource.type': 'synthetic',
        'service.name': 'opentelemetry-demo',
        'namespace': 'ad',
        'version': '2.1.2',
      },
    },
    {
      id: '2',
      status: 'CRITICAL' as const,
      resource: 'Unknown opentelemetry-demo:flagd',
      summary: 'summary [dash0.resource.name=opentelemetry-demo:flagd] [dash0.resource.type=synthetic] +2 more attributes',
      ruleName: 'New Check Rule',
      timestamp: '2024-01-15T18:15:30Z',
      attributes: {
        'dash0.resource.name': 'opentelemetry-demo:flagd',
        'dash0.resource.type': 'synthetic',
        'service.name': 'opentelemetry-demo',
        'namespace': 'ad',
      },
    },
    {
      id: '3',
      status: 'WARNING' as const,
      resource: 'OTEL Collector',
      summary: 'OTEL Collector export failures',
      ruleName: 'OTEL Collector export failures',
      timestamp: '2024-01-15T18:12:15Z',
      attributes: {
        'component': 'exporter',
        'exporter': 'otlp',
        'service.name': 'otel-collector',
      },
    },
  ] as FailedCheck[],

  timelineData: {
    '1h': [
      { time: '18:00', status: 'healthy' as const, count: 0 },
      { time: '18:05', status: 'healthy' as const, count: 0 },
      { time: '18:10', status: 'warning' as const, count: 1 },
      { time: '18:15', status: 'critical' as const, count: 2 },
      { time: '18:20', status: 'critical' as const, count: 3 },
      { time: '18:25', status: 'critical' as const, count: 2 },
      { time: '18:30', status: 'warning' as const, count: 1 },
      { time: '18:35', status: 'healthy' as const, count: 0 },
      { time: '18:40', status: 'healthy' as const, count: 0 },
      { time: '18:45', status: 'healthy' as const, count: 0 },
      { time: '18:50', status: 'healthy' as const, count: 0 },
      { time: '18:55', status: 'healthy' as const, count: 0 },
    ],
    '6h': [
      { time: '12:00', status: 'healthy' as const, count: 0 },
      { time: '13:00', status: 'healthy' as const, count: 0 },
      { time: '14:00', status: 'warning' as const, count: 1 },
      { time: '15:00', status: 'critical' as const, count: 3 },
      { time: '16:00', status: 'critical' as const, count: 2 },
      { time: '17:00', status: 'warning' as const, count: 1 },
      { time: '18:00', status: 'critical' as const, count: 2 },
    ],
    '1d': [
      { time: '00:00', status: 'healthy' as const, count: 0 },
      { time: '02:00', status: 'healthy' as const, count: 0 },
      { time: '04:00', status: 'healthy' as const, count: 0 },
      { time: '06:00', status: 'warning' as const, count: 1 },
      { time: '08:00', status: 'critical' as const, count: 2 },
      { time: '10:00', status: 'critical' as const, count: 3 },
      { time: '12:00', status: 'warning' as const, count: 1 },
      { time: '14:00', status: 'healthy' as const, count: 0 },
      { time: '16:00', status: 'critical' as const, count: 2 },
      { time: '18:00', status: 'critical' as const, count: 3 },
      { time: '20:00', status: 'warning' as const, count: 1 },
      { time: '22:00', status: 'healthy' as const, count: 0 },
    ],
    '7d': [
      { time: 'Mon', status: 'healthy' as const, count: 0 },
      { time: 'Tue', status: 'warning' as const, count: 1 },
      { time: 'Wed', status: 'critical' as const, count: 3 },
      { time: 'Thu', status: 'critical' as const, count: 2 },
      { time: 'Fri', status: 'warning' as const, count: 1 },
      { time: 'Sat', status: 'healthy' as const, count: 0 },
      { time: 'Sun', status: 'healthy' as const, count: 0 },
    ],
  },
};

// Development mode için mock API wrapper
export const mockApi = {
  async getAlertRules(): Promise<AlertRule[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAlertsData.alertRules), 500);
    });
  },

  async getFailedChecks(timeRange: TimeRange): Promise<FailedCheck[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAlertsData.failedChecks), 500);
    });
  },

  async getTimelineData(timeRange: TimeRange): Promise<TimelineData[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAlertsData.timelineData[timeRange] || []), 500);
    });
  },

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const ruleIndex = mockAlertsData.alertRules.findIndex(rule => rule.id === ruleId);
        if (ruleIndex !== -1) {
          mockAlertsData.alertRules[ruleIndex] = {
            ...mockAlertsData.alertRules[ruleIndex],
            ...updates,
          };
        }
        resolve();
      }, 500);
    });
  },
};

// Environment'a göre API seçimi
const isDevelopment = process.env.NODE_ENV === 'development';
export const api = isDevelopment ? mockApi : alertsApi;
