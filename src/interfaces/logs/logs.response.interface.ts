export interface LogItem {
    id: string;
    timestamp: string;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
    service: string;
    message: string;
    attributes: Record<string, any>;
    traceId?: string;
    spanId?: string;
    hostname?: string;
    environment?: string;
    namespace?: string;
    pod?: string;
    deployment?: string;
    cluster?: string;
}