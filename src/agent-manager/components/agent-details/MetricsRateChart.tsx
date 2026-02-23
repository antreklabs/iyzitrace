import React, { useMemo, useState } from "react";
import { Info } from "lucide-react";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    Line,
    LineChart,
} from "recharts";
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@agent-manager/components/ui/tooltip";

interface ChartDataPoint {
    time: string;
    timestamp: number;
    [key: string]: number | string;
}

interface SeriesConfig {
    dataKey: string;
    name: string;
    color: string;
}

interface SeriesStats {
    name: string;
    color: string;
    min: number;
    max: number;
    mean: number;
}

interface MetricsRateChartProps {
    title: string;
    description?: string;
    data: ChartDataPoint[];
    series: SeriesConfig[];
    height?: number;
    showStats?: boolean;
}

// Grafana-style color palette for multiple series - each series gets unique color
export const SERIES_COLORS = [
    "#73BF69", // Green
    "#5794F2", // Blue  
    "#F2CC0C", // Yellow
    "#B877D9", // Purple
    "#36A2EB", // Light Blue
    "#FF9830", // Orange
    "#4ECDC4", // Teal
    "#95E1D3", // Mint
];

// Special colors for error states
export const STATUS_COLORS = {
    Failed: "#FF5C5C",    // Red
    Refused: "#FF9830",   // Orange (different from Failed)
};

/**
 * Grafana-style rate chart component for displaying metrics over time.
 * Features:
 * - Title with info button
 * - Multiple series support with different colors
 * - Stats table (Name, Min, Max, Mean)
 * - Gradient fill area charts
 */
export function MetricsRateChart({
    title,
    description,
    data,
    series,
    height = 150,
    showStats = true,
}: MetricsRateChartProps) {
    // Calculate stats for each series
    const seriesStats = useMemo<SeriesStats[]>(() => {
        return series.map((s) => {
            const values = data
                .map((d) => (typeof d[s.dataKey] === "number" ? (d[s.dataKey] as number) : 0))
                .filter((v) => v !== undefined && v !== null);

            if (values.length === 0) {
                return { name: s.name, color: s.color, min: 0, max: 0, mean: 0 };
            }

            const min = Math.min(...values);
            const max = Math.max(...values);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;

            return { name: s.name, color: s.color, min, max, mean };
        });
    }, [data, series]);

    if (!data || data.length === 0) {
        return (
            <div className="space-y-2 p-3 bg-card/50 rounded-lg border border-border/50">
                <ChartHeader title={title} description={description} />
                <div
                    className="flex items-center justify-center bg-muted/20 rounded"
                    style={{ height }}
                >
                    <span className="text-xs text-muted-foreground">No data available</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 p-3 bg-card/50 rounded-lg border border-border/50">
            {/* Header with title and info button */}
            <ChartHeader title={title} description={description} />

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.3}
                        vertical={true}
                        horizontal={true}
                    />
                    <XAxis
                        dataKey="time"
                        className="am-font-10"
                        stroke="hsl(var(--muted-foreground))"
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))", opacity: 0.5 }}
                    />
                    <YAxis
                        className="am-font-10"
                        stroke="hsl(var(--muted-foreground))"
                        tickLine={false}
                        axisLine={{ stroke: "hsl(var(--border))", opacity: 0.5 }}
                        width={35}
                        tickFormatter={(value) => formatYAxisValue(value)}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                            fontSize: "11px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))", marginBottom: "4px" }}
                        formatter={(value: number, name: string) => [
                            formatTooltipValue(value),
                            name,
                        ]}
                    />
                    {series.map((s) => (
                        <Line
                            key={s.dataKey}
                            type="monotone"
                            dataKey={s.dataKey}
                            name={s.name}
                            stroke={s.color}
                            strokeWidth={1.5}
                            dot={false}
                            activeDot={{ r: 3, strokeWidth: 0 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            {/* Stats Table */}
            {showStats && seriesStats.length > 0 && (
                <StatsTable stats={seriesStats} />
            )}
        </div>
    );
}

interface ChartHeaderProps {
    title: string;
    description?: string;
}

function ChartHeader({ title, description }: ChartHeaderProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{title}</span>
            {description && (
                <TooltipProvider>
                    <UITooltip>
                        <TooltipTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground transition-colors">
                                <Info className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                            <p className="text-xs">{description}</p>
                        </TooltipContent>
                    </UITooltip>
                </TooltipProvider>
            )}
        </div>
    );
}

interface StatsTableProps {
    stats: SeriesStats[];
}

function StatsTable({ stats }: StatsTableProps) {
    return (
        <div className="mt-2">
            <table className="w-full text-xs">
                <thead>
                    <tr className="text-muted-foreground border-b border-border/30">
                        <th className="text-left font-medium py-1.5 text-primary">Name</th>
                        <th className="text-right font-medium py-1.5 text-primary">Min</th>
                        <th className="text-right font-medium py-1.5 text-primary">Max</th>
                        <th className="text-right font-medium py-1.5 text-primary">Mean</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.map((stat) => (
                        <tr key={stat.name} className="border-b border-border/20 last:border-0">
                            <td className="py-1.5">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-0.5 rounded-full"
                                        style={{ backgroundColor: stat.color }}
                                    />
                                    <span style={{ color: stat.color }}>{stat.name}</span>
                                </div>
                            </td>
                            <td className="text-right py-1.5 text-muted-foreground">
                                {formatStatValue(stat.min)}
                            </td>
                            <td className="text-right py-1.5 text-muted-foreground">
                                {formatStatValue(stat.max)}
                            </td>
                            <td className="text-right py-1.5 text-muted-foreground">
                                {formatStatValue(stat.mean)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Metric names grouped by component type
export const METRIC_DESCRIPTIONS = {
    // Receivers
    receiver_accepted_log_records:
        "Accepted: count/rate of log records successfully pushed into the pipeline.",
    receiver_accepted_metric_points:
        "Accepted: count/rate of metric points successfully pushed into the pipeline.",
    receiver_accepted_spans:
        "Accepted: count/rate of spans successfully pushed into the pipeline.",
    receiver_refused_log_records:
        "Refused: count/rate of log records that could not be pushed into the pipeline.",
    receiver_refused_metric_points:
        "Refused: count/rate of metric points that could not be pushed into the pipeline.",
    receiver_refused_spans:
        "Refused: count/rate of spans that could not be pushed into the pipeline.",

    // Processors
    processor_accepted_log_records:
        "Incoming/Outgoing: count/rate of log records processed.",
    processor_accepted_metric_points:
        "Incoming/Outgoing: count/rate of metric points processed.",
    processor_accepted_spans:
        "Incoming/Outgoing: count/rate of spans processed.",

    // Exporters
    exporter_sent_log_records:
        "Sent: count/rate of log records successfully sent to destination.",
    exporter_sent_metric_points:
        "Sent: count/rate of metric points successfully sent to destination.",
    exporter_sent_spans:
        "Sent: count/rate of spans successfully sent to destination.",
    exporter_failed_log_records:
        "Failed: count/rate of log records that failed to be sent.",
    exporter_failed_metric_points:
        "Failed: count/rate of metric points that failed to be sent.",
    exporter_failed_spans:
        "Failed: count/rate of spans that failed to be sent.",
};

function formatYAxisValue(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(0)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
}

function formatTooltipValue(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
}

function formatStatValue(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
}
