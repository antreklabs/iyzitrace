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

    static fromPromQLHistogramQuantile(
        quantile: number,
        serviceName: string,
        rateInterval = '5m'
    ): string {
        return `histogram_quantile(${quantile}, sum(rate(traces_spanmetrics_latency_bucket{span_name="${serviceName}"}[${rateInterval}])) by (le))`;
    }

    static sumRate(spanName: string, rateInterval = '5m'): string {
        return `sum(rate(traces_spanmetrics_latency_bucket{span_name="${spanName}"}[${rateInterval}])) by (le)`;
    }

    static errorRate(spanName: string, rateInterval = '5m'): string {
        return `sum(rate(traces_spanmetrics_calls_total{span_name="${spanName}", status_code!="STATUS_CODE_UNSET"}[${rateInterval}])) / sum(rate(traces_spanmetrics_calls_total{span_name="${spanName}"}[${rateInterval}]))`;
    }

    static opsPerSec(spanName: string, rateInterval = '5m'): string {
        return `sum(rate(traces_spanmetrics_calls_total{span_name="${spanName}"}[${rateInterval}]))`;
    }

    static totalCalls(spanName: string, rateInterval = '5m'): string {
        return `sum(increase(traces_spanmetrics_calls_total{span_name="${spanName}"}[${rateInterval}]))`;
    }

    static errorCount(spanName: string, rateInterval = '5m'): string {
        return `sum(increase(traces_spanmetrics_calls_total{span_name="${spanName}", status_code!="STATUS_CODE_UNSET"}[${rateInterval}]))`;
    }

    static latencyBucket(spanName: string, le: string, rateInterval = '5m'): string {
        return `rate(traces_spanmetrics_latency_bucket{span_name="${spanName}", le="${le}"}[${rateInterval}])`;
    }

    static approxAvgLatency(spanName: string, rateInterval = '5m'): string {
        return `sum(rate(traces_spanmetrics_latency_sum{span_name="${spanName}"}[${rateInterval}])) / sum(rate(traces_spanmetrics_latency_count{span_name="${spanName}"}[${rateInterval}]))`;
    }
}