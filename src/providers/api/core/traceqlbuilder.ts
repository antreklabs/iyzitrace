import { buildQuery, QueryKeys } from '../prometheus/prometheus.registry';

type Operator = '=' | '!=' | '=~' | '!~' | '>' | '<' | '>=' | '<=';

interface Condition {
    key: string;
    op: Operator;
    value: string | number;
}

export class TraceQLBuilder {
    private conditions: Condition[] = [];

    where(key: string, op: Operator, value: string | number): this {
        this.conditions.push({ key, op, value });
        return this;
    }

    and(key: string, op: Operator, value: string | number): this {
        return this.where(key, op, value);
    }

    clear(): this {
        this.conditions = [];
        return this;
    }

    toString(): string {
        return this.conditions
            .map(({ key, op, value }) => {
                const formattedValue = typeof value === 'string' ? `"${value}"` : value;
                return `${key} ${op} ${formattedValue}`;
            })
            .join(' and ');
    }

    static async fromPromQLHistogramQuantile(
        quantile: number,
        serviceName: string,
        rateInterval = '5m'
    ): Promise<string> {
        const ctx = { serviceName: '', spanName: serviceName, rateInterval, quantile, windowSeconds: 300 };
        return await buildQuery(QueryKeys.p50Latency, ctx); // This will be overridden by quantile parameter
    }

    static async sumRate(spanName: string, rateInterval = '5m'): Promise<string> {
        const ctx = { serviceName: '', spanName, rateInterval, windowSeconds: 300 };
        return await buildQuery(QueryKeys.opsPerSec, ctx); // Using opsPerSec as closest match
    }

    static async errorRate(spanName: string, rateInterval = '5m'): Promise<string> {
        const ctx = { serviceName: '', spanName, rateInterval, windowSeconds: 300 };
        return await buildQuery(QueryKeys.errorRate, ctx);
    }

    static async opsPerSec(spanName: string, rateInterval = '5m'): Promise<string> {
        const ctx = { serviceName: '', spanName, rateInterval, windowSeconds: 300 };
        return await buildQuery(QueryKeys.opsPerSec, ctx);
    }

    static async totalCalls(spanName: string, rateInterval = '5m'): Promise<string> {
        const ctx = { serviceName: '', spanName, rateInterval, windowSeconds: 300 };
        return await buildQuery(QueryKeys.totalCalls, ctx);
    }

    static async errorCount(spanName: string, rateInterval = '5m'): Promise<string> {
        const ctx = { serviceName: '', spanName, rateInterval, windowSeconds: 300 };
        return await buildQuery(QueryKeys.errorCount, ctx);
    }

    static async latencyBucket(spanName: string, le: string, rateInterval = '5m'): Promise<string> {
        const ctx = { serviceName: '', spanName, le, rateInterval, windowSeconds: 300 };
        return await buildQuery(QueryKeys.latencyBucket, ctx);
    }

    static async approxAvgLatency(spanName: string, rateInterval = '5m'): Promise<string> {
        const ctx = { serviceName: '', spanName, rateInterval, windowSeconds: 300 };
        return await buildQuery(QueryKeys.approxAvgLatency, ctx);
    }
}