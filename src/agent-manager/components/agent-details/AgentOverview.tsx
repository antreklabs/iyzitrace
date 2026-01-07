import React from "react";
import { Badge } from "@agent-manager/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@agent-manager/components/ui/card";
import { InfoCard } from "@agent-manager/components/ui/info-card";

interface Agent {
  id: string;
  name: string;
  version: string;
  status: string;
  group_name?: string;
  last_seen: string;
  labels?: Record<string, string | number | boolean>;
  capabilities?: string[];
}

interface Metrics {
  metric_count: number;
  log_count: number;
  trace_count: number;
  throughput_rps: number;
}

interface AgentOverviewProps {
  agent: Agent;
  metrics?: Metrics;
  timeRange?: "1h" | "6h" | "24h";
  onTimeRangeChange?: (range: "1h" | "6h" | "24h") => void;
}

// StatCard component for displaying stats with colored background
interface StatCardProps {
  label: string;
  value: number | string;
  color: "blue" | "green" | "purple" | "orange";
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  };

  const displayValue = typeof value === "number"
    ? (value === 0 ? "-" : value.toLocaleString())
    : value;

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-xl font-bold">{displayValue}</p>
    </div>
  );
}

export function AgentOverview({ agent, metrics, timeRange = "1h", onTimeRangeChange }: AgentOverviewProps) {
  return (
    <div className="space-y-4">
      <InfoCard
        title="Agent Information"
        items={[
          {
            label: "ID",
            value: <span className="font-mono">{agent.id}</span>,
          },
          { label: "Version", value: agent.version },
          {
            label: "Status",
            value: (
              <Badge
                variant={agent.status === "online" ? "default" : "secondary"}
              >
                {agent.status}
              </Badge>
            ),
          },
          { label: "Group", value: agent.group_name || "No Group" },
          {
            label: "Last Seen",
            value: new Date(agent.last_seen).toLocaleString(),
          },
        ]}
      />

      {metrics && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Telemetry Stats</CardTitle>
              {onTimeRangeChange && (
                <div className="flex rounded-lg border bg-muted p-0.5">
                  {(["1h", "6h", "24h"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => onTimeRangeChange(range)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeRange === range
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Metrics"
                value={metrics.metric_count}
                color="blue"
              />
              <StatCard
                label="Logs"
                value={metrics.log_count}
                color="green"
              />
              <StatCard
                label="Traces"
                value={metrics.trace_count}
                color="purple"
              />
              <StatCard
                label="Throughput"
                value={`${metrics?.throughput_rps?.toFixed(1)} rps`}
                color="orange"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {agent.capabilities && agent.capabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.map((capability) => (
                <Badge key={capability} variant="secondary">
                  {capability}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {agent.labels && Object.keys(agent.labels).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(agent.labels).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}={String(value)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
