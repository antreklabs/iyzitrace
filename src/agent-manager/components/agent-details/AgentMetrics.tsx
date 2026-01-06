import React, { useMemo, useState } from "react";
import {
  Activity,
  Database,
  Upload,
} from "lucide-react";
import useSWR from "swr";

import { queryMetrics, type MetricData } from "@agent-manager/api/telemetry";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@agent-manager/components/ui/card";
import { LoadingSpinner } from "@agent-manager/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@agent-manager/components/ui/tabs";
import { MetricsRateChart, SERIES_COLORS, STATUS_COLORS, METRIC_DESCRIPTIONS } from "./MetricsRateChart";

interface AgentMetricsProps {
  agentId: string;
}

interface ComponentMetrics {
  name: string;
  metrics: MetricData[];
  type: "receiver" | "processor" | "exporter";
}

interface TimeSeriesPoint {
  time: string;
  timestamp: number;
  [key: string]: number | string;
}

interface SeriesConfig {
  dataKey: string;
  name: string;
  color: string;
}

interface GroupedChartData {
  data: TimeSeriesPoint[];
  series: SeriesConfig[];
}

export function AgentMetrics({ agentId }: AgentMetricsProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h">("1h");

  const { data: metricsData, isLoading } = useSWR(
    `agent-metrics-${agentId}-${timeRange}`,
    async () => {
      const endTime = new Date();
      const hours = timeRange === "1h" ? 1 : timeRange === "6h" ? 6 : 24;
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

      const result = await queryMetrics({
        agent_id: agentId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        limit: 10000,
      });
      return result.metrics || [];
    },
    {
      refreshInterval: 30000,
    },
  );

  // Group metrics by component type
  const groupedMetrics = useMemo(() => {
    if (!metricsData) {
      return { receivers: [], processors: [], exporters: [] };
    }

    const receivers: ComponentMetrics[] = [];
    const processors: ComponentMetrics[] = [];
    const exporters: ComponentMetrics[] = [];

    const componentMap = new Map<
      string,
      { type: "receiver" | "processor" | "exporter"; metrics: MetricData[] }
    >();

    metricsData.forEach((metric) => {
      let componentType: "receiver" | "processor" | "exporter" | null = null;
      let componentName = "";

      if (metric.metric_name.includes("receiver")) {
        componentType = "receiver";
        componentName =
          (metric.metric_attributes?.receiver as string) || "unknown_receiver";
      } else if (metric.metric_name.includes("processor")) {
        componentType = "processor";
        componentName =
          (metric.metric_attributes?.processor as string) ||
          "unknown_processor";
      } else if (metric.metric_name.includes("exporter")) {
        componentType = "exporter";
        componentName =
          (metric.metric_attributes?.exporter as string) || "unknown_exporter";
      }

      if (componentType && componentName) {
        const key = `${componentType}:${componentName}`;
        if (!componentMap.has(key)) {
          componentMap.set(key, { type: componentType, metrics: [] });
        }
        componentMap.get(key)!.metrics.push(metric);
      }
    });

    componentMap.forEach((value, key) => {
      const name = key.split(":")[1];
      const component = { name, metrics: value.metrics, type: value.type };

      if (value.type === "receiver") {
        receivers.push(component);
      } else if (value.type === "processor") {
        processors.push(component);
      } else if (value.type === "exporter") {
        exporters.push(component);
      }
    });

    return { receivers, processors, exporters };
  }, [metricsData]);

  // Prepare grouped rate chart data with multi-series support
  const rateChartData = useMemo(() => {
    const emptyResult = {
      receivers: { logs: { data: [], series: [] } as GroupedChartData, metrics: { data: [], series: [] } as GroupedChartData, spans: { data: [], series: [] } as GroupedChartData },
      processors: { logs: { data: [], series: [] } as GroupedChartData, metrics: { data: [], series: [] } as GroupedChartData, spans: { data: [], series: [] } as GroupedChartData },
      exporters: { logs: { data: [], series: [] } as GroupedChartData, metrics: { data: [], series: [] } as GroupedChartData, spans: { data: [], series: [] } as GroupedChartData },
    };

    if (!metricsData) {
      return emptyResult;
    }

    const getStatus = (metricName: string): string => {
      if (metricName.includes("accepted")) { return "Accepted"; }
      if (metricName.includes("refused")) { return "Refused"; }
      if (metricName.includes("sent")) { return "Sent"; }
      if (metricName.includes("failed") || metricName.includes("enqueue_failed")) { return "Failed"; }
      if (metricName.includes("incoming")) { return "Incoming"; }
      if (metricName.includes("outgoing")) { return "Outgoing"; }
      return "";
    };

    const prepareGroupedTimeSeriesData = (
      metrics: MetricData[],
      metricNameFilter: string,
      componentAttrName: string
    ): GroupedChartData => {
      const filtered = metrics.filter((m) =>
        m.metric_name.includes(metricNameFilter)
      );

      if (filtered.length === 0) {
        return { data: [], series: [] };
      }

      const seriesMap = new Map<string, { name: string; color: string }>();
      let colorIndex = 0;

      filtered.forEach((m) => {
        const componentName = (m.metric_attributes?.[componentAttrName] as string) || "unknown";
        const status = getStatus(m.metric_name);
        const seriesKey = status ? `${status}: ${componentName}` : componentName;

        if (!seriesMap.has(seriesKey)) {
          let color: string;
          if (status === "Failed") {
            color = STATUS_COLORS.Failed;
          } else if (status === "Refused") {
            color = STATUS_COLORS.Refused;
          } else {
            color = SERIES_COLORS[colorIndex % SERIES_COLORS.length];
            colorIndex++;
          }
          seriesMap.set(seriesKey, { name: seriesKey, color });
        }
      });

      const timeMap = new Map<number, TimeSeriesPoint>();

      filtered.forEach((m) => {
        const ts = Math.floor(new Date(m.timestamp).getTime() / 60000) * 60000;
        const componentName = (m.metric_attributes?.[componentAttrName] as string) || "unknown";
        const status = getStatus(m.metric_name);
        const seriesKey = status ? `${status}: ${componentName}` : componentName;

        if (!timeMap.has(ts)) {
          timeMap.set(ts, {
            time: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timestamp: ts,
          });
        }

        const point = timeMap.get(ts)!;
        const currentValue = (point[seriesKey] as number) || 0;
        point[seriesKey] = currentValue + m.value;
      });

      const data = Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp);
      const series: SeriesConfig[] = Array.from(seriesMap.entries()).map(([key, val]) => ({
        dataKey: key,
        name: val.name,
        color: val.color,
      }));

      return { data, series };
    };

    const receiverMetrics = metricsData.filter((m) => m.metric_name.includes("receiver"));
    const processorMetrics = metricsData.filter((m) => m.metric_name.includes("processor"));
    const exporterMetrics = metricsData.filter((m) => m.metric_name.includes("exporter"));

    return {
      receivers: {
        logs: prepareGroupedTimeSeriesData(receiverMetrics, "log_records", "receiver"),
        metrics: prepareGroupedTimeSeriesData(receiverMetrics, "metric_points", "receiver"),
        spans: prepareGroupedTimeSeriesData(receiverMetrics, "spans", "receiver"),
      },
      processors: {
        logs: prepareGroupedTimeSeriesData(processorMetrics, "log_records", "processor"),
        metrics: prepareGroupedTimeSeriesData(processorMetrics, "metric_points", "processor"),
        spans: prepareGroupedTimeSeriesData(processorMetrics, "spans", "processor"),
      },
      exporters: {
        logs: prepareGroupedTimeSeriesData(exporterMetrics, "log_records", "exporter"),
        metrics: prepareGroupedTimeSeriesData(exporterMetrics, "metric_points", "exporter"),
        spans: prepareGroupedTimeSeriesData(exporterMetrics, "spans", "exporter"),
      },
    };
  }, [metricsData]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setTimeRange("1h")}
          className={`px-3 py-1 text-xs rounded ${timeRange === "1h"
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
            }`}
        >
          1h
        </button>
        <button
          onClick={() => setTimeRange("6h")}
          className={`px-3 py-1 text-xs rounded ${timeRange === "6h"
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
            }`}
        >
          6h
        </button>
        <button
          onClick={() => setTimeRange("24h")}
          className={`px-3 py-1 text-xs rounded ${timeRange === "24h"
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80"
            }`}
        >
          24h
        </button>
      </div>

      {/* Component Metrics Tabs */}
      <Tabs defaultValue="receivers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="receivers">
            Receivers ({groupedMetrics.receivers.length})
          </TabsTrigger>
          <TabsTrigger value="processors">
            Processors ({groupedMetrics.processors.length})
          </TabsTrigger>
          <TabsTrigger value="exporters">
            Exporters ({groupedMetrics.exporters.length})
          </TabsTrigger>
        </TabsList>

        {/* Receivers Tab */}
        <TabsContent value="receivers" className="space-y-4">
          {groupedMetrics.receivers.length > 0 ? (
            <>
              {groupedMetrics.receivers.map((component) => (
                <ComponentSummaryCard
                  key={component.name}
                  component={component}
                  icon={<Database className="h-4 w-4" />}
                />
              ))}

              <div className="space-y-4">
                <MetricsRateChart
                  title="Spans Rate"
                  description={METRIC_DESCRIPTIONS.receiver_accepted_spans}
                  data={rateChartData.receivers.spans.data}
                  series={rateChartData.receivers.spans.series}
                />
                <MetricsRateChart
                  title="Metric Points Rate"
                  description={METRIC_DESCRIPTIONS.receiver_accepted_metric_points}
                  data={rateChartData.receivers.metrics.data}
                  series={rateChartData.receivers.metrics.series}
                />
                <MetricsRateChart
                  title="Log Records Rate"
                  description={METRIC_DESCRIPTIONS.receiver_accepted_log_records}
                  data={rateChartData.receivers.logs.data}
                  series={rateChartData.receivers.logs.series}
                />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No receiver metrics available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Processors Tab */}
        <TabsContent value="processors" className="space-y-4">
          {groupedMetrics.processors.length > 0 ? (
            <>
              {groupedMetrics.processors.map((component) => (
                <ComponentSummaryCard
                  key={component.name}
                  component={component}
                  icon={<Activity className="h-4 w-4" />}
                />
              ))}

              <div className="space-y-4">
                <MetricsRateChart
                  title="Spans Rate"
                  description={METRIC_DESCRIPTIONS.processor_accepted_spans}
                  data={rateChartData.processors.spans.data}
                  series={rateChartData.processors.spans.series}
                />
                <MetricsRateChart
                  title="Metric Points Rate"
                  description={METRIC_DESCRIPTIONS.processor_accepted_metric_points}
                  data={rateChartData.processors.metrics.data}
                  series={rateChartData.processors.metrics.series}
                />
                <MetricsRateChart
                  title="Log Records Rate"
                  description={METRIC_DESCRIPTIONS.processor_accepted_log_records}
                  data={rateChartData.processors.logs.data}
                  series={rateChartData.processors.logs.series}
                />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No processor metrics available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Exporters Tab */}
        <TabsContent value="exporters" className="space-y-4">
          {groupedMetrics.exporters.length > 0 ? (
            <>
              {groupedMetrics.exporters.map((component) => (
                <ComponentSummaryCard
                  key={component.name}
                  component={component}
                  icon={<Upload className="h-4 w-4" />}
                />
              ))}

              <div className="space-y-4">
                <MetricsRateChart
                  title="Spans Rate"
                  description={METRIC_DESCRIPTIONS.exporter_sent_spans}
                  data={rateChartData.exporters.spans.data}
                  series={rateChartData.exporters.spans.series}
                />
                <MetricsRateChart
                  title="Metric Points Rate"
                  description={METRIC_DESCRIPTIONS.exporter_sent_metric_points}
                  data={rateChartData.exporters.metrics.data}
                  series={rateChartData.exporters.metrics.series}
                />
                <MetricsRateChart
                  title="Log Records Rate"
                  description={METRIC_DESCRIPTIONS.exporter_sent_log_records}
                  data={rateChartData.exporters.logs.data}
                  series={rateChartData.exporters.logs.series}
                />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No exporter metrics available
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ComponentSummaryCardProps {
  component: ComponentMetrics;
  icon: React.ReactNode;
}

function ComponentSummaryCard({ component, icon }: ComponentSummaryCardProps) {
  const metricsByName = useMemo(() => {
    const map = new Map<string, MetricData[]>();
    component.metrics.forEach((metric) => {
      if (!map.has(metric.metric_name)) {
        map.set(metric.metric_name, []);
      }
      map.get(metric.metric_name)!.push(metric);
    });
    return map;
  }, [component.metrics]);

  // Calculate all stats for 3x3 grid
  const stats = useMemo(() => {
    const getLatestValue = (filter: (name: string) => boolean): number => {
      let total = 0;
      metricsByName.forEach((metrics, name) => {
        if (filter(name) && metrics.length > 0) {
          const sorted = [...metrics].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
          total += sorted[0].value;
        }
      });
      return total;
    };

    if (component.type === "receiver") {
      return {
        // Accepted (green)
        acceptedSpans: getLatestValue((n) => n.includes("accepted_spans")),
        acceptedLogs: getLatestValue((n) => n.includes("accepted_log_records")),
        acceptedMetrics: getLatestValue((n) => n.includes("accepted_metric_points")),
        // Refused (orange)
        refusedSpans: getLatestValue((n) => n.includes("refused_spans")),
        refusedLogs: getLatestValue((n) => n.includes("refused_log_records")),
        refusedMetrics: getLatestValue((n) => n.includes("refused_metric_points")),
      };
    } else if (component.type === "processor") {
      return {
        // Accepted/Incoming (blue)
        acceptedSpans: getLatestValue((n) => n.includes("accepted_spans") || n.includes("incoming_spans")),
        acceptedLogs: getLatestValue((n) => n.includes("accepted_log_records") || n.includes("incoming_log_records")),
        acceptedMetrics: getLatestValue((n) => n.includes("accepted_metric_points") || n.includes("incoming_metric_points")),
        // Dropped (orange)
        droppedSpans: getLatestValue((n) => n.includes("dropped_spans") || n.includes("refused_spans")),
        droppedLogs: getLatestValue((n) => n.includes("dropped_log_records") || n.includes("refused_log_records")),
        droppedMetrics: getLatestValue((n) => n.includes("dropped_metric_points") || n.includes("refused_metric_points")),
      };
    } else {
      // Exporter
      return {
        // Sent (green)
        sentSpans: getLatestValue((n) => n.includes("sent_spans")),
        sentLogs: getLatestValue((n) => n.includes("sent_log_records")),
        sentMetrics: getLatestValue((n) => n.includes("sent_metric_points")),
        // Failed (red)
        failedSpans: getLatestValue((n) => n.includes("failed") && n.includes("spans")),
        failedLogs: getLatestValue((n) => n.includes("failed") && n.includes("log_records")),
        failedMetrics: getLatestValue((n) => n.includes("failed") && n.includes("metric_points")),
      };
    }
  }, [component.type, metricsByName]);

  // 3x3 Grid for Receivers
  const renderReceiverGrid = () => (
    <div className="grid grid-cols-3 gap-2">
      {/* Row headers - Accepted */}
      <StatBadge label="Spans" sublabel="Accepted" value={stats.acceptedSpans} color="green" />
      <StatBadge label="Logs" sublabel="Accepted" value={stats.acceptedLogs} color="green" />
      <StatBadge label="Metrics" sublabel="Accepted" value={stats.acceptedMetrics} color="green" />
      {/* Refused */}
      <StatBadge label="Spans" sublabel="Refused" value={stats.refusedSpans} color="orange" />
      <StatBadge label="Logs" sublabel="Refused" value={stats.refusedLogs} color="orange" />
      <StatBadge label="Metrics" sublabel="Refused" value={stats.refusedMetrics} color="orange" />
    </div>
  );

  // 3x3 Grid for Processors
  const renderProcessorGrid = () => (
    <div className="grid grid-cols-3 gap-2">
      {/* Accepted/Incoming */}
      <StatBadge label="Spans" sublabel="Accepted" value={stats.acceptedSpans} color="blue" />
      <StatBadge label="Logs" sublabel="Accepted" value={stats.acceptedLogs} color="blue" />
      <StatBadge label="Metrics" sublabel="Accepted" value={stats.acceptedMetrics} color="blue" />
      {/* Dropped */}
      <StatBadge label="Spans" sublabel="Dropped" value={stats.droppedSpans} color="orange" />
      <StatBadge label="Logs" sublabel="Dropped" value={stats.droppedLogs} color="orange" />
      <StatBadge label="Metrics" sublabel="Dropped" value={stats.droppedMetrics} color="orange" />
    </div>
  );

  // 3x3 Grid for Exporters
  const renderExporterGrid = () => (
    <div className="grid grid-cols-3 gap-2">
      {/* Sent */}
      <StatBadge label="Spans" sublabel="Sent" value={stats.sentSpans} color="green" />
      <StatBadge label="Logs" sublabel="Sent" value={stats.sentLogs} color="green" />
      <StatBadge label="Metrics" sublabel="Sent" value={stats.sentMetrics} color="green" />
      {/* Failed */}
      <StatBadge label="Spans" sublabel="Failed" value={stats.failedSpans} color="red" />
      <StatBadge label="Logs" sublabel="Failed" value={stats.failedLogs} color="red" />
      <StatBadge label="Metrics" sublabel="Failed" value={stats.failedMetrics} color="red" />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {component.name}
        </CardTitle>
        <CardDescription>
          {component.metrics.length} data points • {metricsByName.size} unique metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {component.type === "receiver" && renderReceiverGrid()}
        {component.type === "processor" && renderProcessorGrid()}
        {component.type === "exporter" && renderExporterGrid()}

      </CardContent>
    </Card>
  );
}

interface StatBadgeProps {
  label: string;
  sublabel?: string;
  value: number;
  color: "green" | "red" | "blue" | "orange" | "purple";
}

function StatBadge({ label, sublabel, value, color }: StatBadgeProps) {
  const colorClasses = {
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className={`text-center px-3 py-2 rounded ${colorClasses[color]}`}>
      <p className="text-xs text-muted-foreground">
        {sublabel ? `${sublabel}` : ""} {label}
      </p>
      <p className="text-sm font-semibold">{formatNumber(value)}</p>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}
