/* Alert Service Interfaces */

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
