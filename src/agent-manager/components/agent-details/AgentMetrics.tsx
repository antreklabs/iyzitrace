import React, { useMemo, useState } from "react";
import {
  Activity,
  Database,
  Upload,
  ChevronDown,
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
import { MetricsRateChart, METRIC_DESCRIPTIONS } from "./MetricsRateChart";

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

// Grafana-style color palette - no duplicates when iterating
const CHART_COLORS = [
  "#73BF69", // Green
  "#5794F2", // Blue
  "#F2CC0C", // Yellow
  "#B877D9", // Purple
  "#36A2EB", // Light Blue
  "#FF9830", // Orange
  "#4ECDC4", // Teal
  "#95E1D3", // Mint
  "#FF6B6B", // Coral
  "#A0D995", // Light Green
];

// Special colors for error states
const STATUS_COLORS = {
  Failed: "#FF5C5C",
  Refused: "#FF9830",
};

export function AgentMetrics({ agentId }: AgentMetricsProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h">("1h");
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(null);
  const [selectedProcessor, setSelectedProcessor] = useState<string | null>(null);
  const [selectedExporter, setSelectedExporter] = useState<string | null>(null);

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

  // Auto-select "All" when data loads
  useMemo(() => {
    if (groupedMetrics.receivers.length > 0 && selectedReceiver === null) {
      setSelectedReceiver("__all__");
    }
    if (groupedMetrics.processors.length > 0 && selectedProcessor === null) {
      setSelectedProcessor("__all__");
    }
    if (groupedMetrics.exporters.length > 0 && selectedExporter === null) {
      setSelectedExporter("__all__");
    }
  }, [groupedMetrics, selectedReceiver, selectedProcessor, selectedExporter]);

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
      componentAttrName: string,
      selectedComponent: string | null
    ): GroupedChartData => {
      // Filter by component if selected (skip if "__all__")
      let filtered = metrics.filter((m) =>
        m.metric_name.includes(metricNameFilter)
      );

      if (selectedComponent && selectedComponent !== "__all__") {
        filtered = filtered.filter((m) => {
          const compName = (m.metric_attributes?.[componentAttrName] as string) || "";
          return compName === selectedComponent;
        });
      }

      if (filtered.length === 0) {
        return { data: [], series: [] };
      }

      // Build unique series from data
      const seriesMap = new Map<string, { name: string; color: string; totalValue: number }>();
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
            color = CHART_COLORS[colorIndex % CHART_COLORS.length];
            colorIndex++;
          }
          seriesMap.set(seriesKey, { name: seriesKey, color, totalValue: 0 });
        }
        seriesMap.get(seriesKey)!.totalValue += m.value;
      });

      // Build time series data
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

      // Filter out series with 0 total value
      const series: SeriesConfig[] = Array.from(seriesMap.entries())
        .filter(([, val]) => val.totalValue > 0)
        .map(([key, val]) => ({
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
        logs: prepareGroupedTimeSeriesData(receiverMetrics, "log_records", "receiver", selectedReceiver),
        metrics: prepareGroupedTimeSeriesData(receiverMetrics, "metric_points", "receiver", selectedReceiver),
        spans: prepareGroupedTimeSeriesData(receiverMetrics, "spans", "receiver", selectedReceiver),
      },
      processors: {
        logs: prepareGroupedTimeSeriesData(processorMetrics, "log_records", "processor", selectedProcessor),
        metrics: prepareGroupedTimeSeriesData(processorMetrics, "metric_points", "processor", selectedProcessor),
        spans: prepareGroupedTimeSeriesData(processorMetrics, "spans", "processor", selectedProcessor),
      },
      exporters: {
        logs: prepareGroupedTimeSeriesData(exporterMetrics, "log_records", "exporter", selectedExporter),
        metrics: prepareGroupedTimeSeriesData(exporterMetrics, "metric_points", "exporter", selectedExporter),
        spans: prepareGroupedTimeSeriesData(exporterMetrics, "spans", "exporter", selectedExporter),
      },
    };
  }, [metricsData, selectedReceiver, selectedProcessor, selectedExporter]);

  // Get selected component data
  const getSelectedComponent = (type: "receiver" | "processor" | "exporter"): ComponentMetrics | null => {
    const components = type === "receiver" ? groupedMetrics.receivers :
      type === "processor" ? groupedMetrics.processors :
        groupedMetrics.exporters;
    const selected = type === "receiver" ? selectedReceiver :
      type === "processor" ? selectedProcessor :
        selectedExporter;
    return components.find(c => c.name === selected) || null;
  };

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
              <ComponentSelector
                components={groupedMetrics.receivers}
                selected={selectedReceiver}
                onSelect={setSelectedReceiver}
                icon={<Database className="h-4 w-4" />}
              />

              {getSelectedComponent("receiver") && (
                <ComponentSummaryCard
                  component={getSelectedComponent("receiver")!}
                  icon={<Database className="h-4 w-4" />}
                />
              )}

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
              <ComponentSelector
                components={groupedMetrics.processors}
                selected={selectedProcessor}
                onSelect={setSelectedProcessor}
                icon={<Activity className="h-4 w-4" />}
              />

              {getSelectedComponent("processor") && (
                <ComponentSummaryCard
                  component={getSelectedComponent("processor")!}
                  icon={<Activity className="h-4 w-4" />}
                />
              )}

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
              <ComponentSelector
                components={groupedMetrics.exporters}
                selected={selectedExporter}
                onSelect={setSelectedExporter}
                icon={<Upload className="h-4 w-4" />}
              />

              {getSelectedComponent("exporter") && (
                <ComponentSummaryCard
                  component={getSelectedComponent("exporter")!}
                  icon={<Upload className="h-4 w-4" />}
                />
              )}

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

// Component Selector Dropdown
interface ComponentSelectorProps {
  components: ComponentMetrics[];
  selected: string | null;
  onSelect: (name: string) => void;
  icon: React.ReactNode;
}

function ComponentSelector({ components, selected, onSelect, icon }: ComponentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{selected === "__all__" ? "All" : (selected || "Select component...")}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* All option */}
          <button
            onClick={() => {
              onSelect("__all__");
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-accent/50 transition-colors ${selected === "__all__" ? "bg-accent" : ""
              }`}
          >
            {icon}
            <span className="font-medium">All</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {components.reduce((sum, c) => sum + c.metrics.length, 0)} pts
            </span>
          </button>
          {/* Individual components */}
          {components.map((comp) => (
            <button
              key={comp.name}
              onClick={() => {
                onSelect(comp.name);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-accent/50 transition-colors ${selected === comp.name ? "bg-accent" : ""
                }`}
            >
              {icon}
              <span>{comp.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {comp.metrics.length} pts
              </span>
            </button>
          ))}
        </div>
      )}
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

  // Calculate all stats for grid
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
        acceptedSpans: getLatestValue((n) => n.includes("accepted_spans")),
        acceptedLogs: getLatestValue((n) => n.includes("accepted_log_records")),
        acceptedMetrics: getLatestValue((n) => n.includes("accepted_metric_points")),
        refusedSpans: getLatestValue((n) => n.includes("refused_spans")),
        refusedLogs: getLatestValue((n) => n.includes("refused_log_records")),
        refusedMetrics: getLatestValue((n) => n.includes("refused_metric_points")),
      };
    } else if (component.type === "processor") {
      return {
        acceptedSpans: getLatestValue((n) => n.includes("accepted_spans") || n.includes("incoming_spans")),
        acceptedLogs: getLatestValue((n) => n.includes("accepted_log_records") || n.includes("incoming_log_records")),
        acceptedMetrics: getLatestValue((n) => n.includes("accepted_metric_points") || n.includes("incoming_metric_points")),
        droppedSpans: getLatestValue((n) => n.includes("dropped_spans") || n.includes("refused_spans")),
        droppedLogs: getLatestValue((n) => n.includes("dropped_log_records") || n.includes("refused_log_records")),
        droppedMetrics: getLatestValue((n) => n.includes("dropped_metric_points") || n.includes("refused_metric_points")),
      };
    } else {
      return {
        sentSpans: getLatestValue((n) => n.includes("sent_spans")),
        sentLogs: getLatestValue((n) => n.includes("sent_log_records")),
        sentMetrics: getLatestValue((n) => n.includes("sent_metric_points")),
        failedSpans: getLatestValue((n) => n.includes("failed") && n.includes("spans")),
        failedLogs: getLatestValue((n) => n.includes("failed") && n.includes("log_records")),
        failedMetrics: getLatestValue((n) => n.includes("failed") && n.includes("metric_points")),
      };
    }
  }, [component.type, metricsByName]);

  // Render stats grid based on component type - only show non-zero values
  const renderStats = () => {
    const items: Array<{ label: string; value: number; color: "green" | "red" | "blue" | "orange" }> = [];

    if (component.type === "receiver") {
      if (stats.acceptedSpans > 0) { items.push({ label: "Accepted Spans", value: stats.acceptedSpans, color: "green" }); }
      if (stats.acceptedLogs > 0) { items.push({ label: "Accepted Logs", value: stats.acceptedLogs, color: "green" }); }
      if (stats.acceptedMetrics > 0) { items.push({ label: "Accepted Metrics", value: stats.acceptedMetrics, color: "green" }); }
      if (stats.refusedSpans > 0) { items.push({ label: "Refused Spans", value: stats.refusedSpans, color: "orange" }); }
      if (stats.refusedLogs > 0) { items.push({ label: "Refused Logs", value: stats.refusedLogs, color: "orange" }); }
      if (stats.refusedMetrics > 0) { items.push({ label: "Refused Metrics", value: stats.refusedMetrics, color: "orange" }); }
    } else if (component.type === "processor") {
      if (stats.acceptedSpans > 0) { items.push({ label: "Accepted Spans", value: stats.acceptedSpans, color: "blue" }); }
      if (stats.acceptedLogs > 0) { items.push({ label: "Accepted Logs", value: stats.acceptedLogs, color: "blue" }); }
      if (stats.acceptedMetrics > 0) { items.push({ label: "Accepted Metrics", value: stats.acceptedMetrics, color: "blue" }); }
      if (stats.droppedSpans > 0) { items.push({ label: "Dropped Spans", value: stats.droppedSpans, color: "orange" }); }
      if (stats.droppedLogs > 0) { items.push({ label: "Dropped Logs", value: stats.droppedLogs, color: "orange" }); }
      if (stats.droppedMetrics > 0) { items.push({ label: "Dropped Metrics", value: stats.droppedMetrics, color: "orange" }); }
    } else {
      if (stats.sentSpans > 0) { items.push({ label: "Sent Spans", value: stats.sentSpans, color: "green" }); }
      if (stats.sentLogs > 0) { items.push({ label: "Sent Logs", value: stats.sentLogs, color: "green" }); }
      if (stats.sentMetrics > 0) { items.push({ label: "Sent Metrics", value: stats.sentMetrics, color: "green" }); }
      if (stats.failedSpans > 0) { items.push({ label: "Failed Spans", value: stats.failedSpans, color: "red" }); }
      if (stats.failedLogs > 0) { items.push({ label: "Failed Logs", value: stats.failedLogs, color: "red" }); }
      if (stats.failedMetrics > 0) { items.push({ label: "Failed Metrics", value: stats.failedMetrics, color: "red" }); }
    }

    if (items.length === 0) {
      return <p className="text-muted-foreground text-sm">No data available</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <StatBadge key={item.label} label={item.label} value={item.value} color={item.color} />
        ))}
      </div>
    );
  };

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
        {renderStats()}
      </CardContent>
    </Card>
  );
}

interface StatBadgeProps {
  label: string;
  value: number;
  color: "green" | "red" | "blue" | "orange";
}

function StatBadge({ label, value, color }: StatBadgeProps) {
  const colorClasses = {
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className={`text-center px-3 py-2 rounded ${colorClasses[color]}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
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
