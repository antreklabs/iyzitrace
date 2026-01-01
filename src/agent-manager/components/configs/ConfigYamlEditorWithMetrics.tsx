import React, { useEffect, useState } from 'react';

import { useTheme } from "../ThemeProvider";

import { type ComponentMetrics } from "@agent-manager/api/collector-metrics";
import {
  parseYamlComponents,
  formatThroughput,
  formatErrorRate,
  type YamlComponent,
} from "@agent-manager/utils/yaml-parser";

interface ConfigYamlEditorWithMetricsProps {
  value: string;
  onChange: (value: string) => void;
  metrics?: ComponentMetrics[];
  readonly?: boolean;
}

export function ConfigYamlEditorWithMetrics({
  value,
  onChange,
  metrics,
  readonly = false,
}: ConfigYamlEditorWithMetricsProps) {
  const [parsedComponents, setParsedComponents] = useState<YamlComponent[]>([]);
  const { theme } = useTheme();

  // Parse YAML to find components whenever value changes
  useEffect(() => {
    if (value) {
      const components = parseYamlComponents(value);
      setParsedComponents(components);
    }
  }, [value]);

  // Calculate summary metrics for display
  const metricsSummary = React.useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const totalThroughput = metrics.reduce((sum, m) => sum + m.throughput, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0);
    const errorRate = totalThroughput > 0 ? (totalErrors / totalThroughput) * 100 : 0;

    return {
      throughput: formatThroughput(totalThroughput),
      errorRate: formatErrorRate(errorRate),
      componentCount: parsedComponents.length,
    };
  }, [metrics, parsedComponents]);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Metrics Summary Bar */}
      {metricsSummary && (
        <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 border-b text-sm">
          <span className="text-muted-foreground">
            Components: <span className="text-foreground font-medium">{metricsSummary.componentCount}</span>
          </span>
          <span className="text-muted-foreground">
            Throughput: <span className="text-foreground font-medium">{metricsSummary.throughput}</span>
          </span>
          {parseFloat(metricsSummary.errorRate) > 0 && (
            <span className="text-muted-foreground">
              Error Rate: <span className="text-red-500 font-medium">{metricsSummary.errorRate}</span>
            </span>
          )}
        </div>
      )}

      {/* YAML Content Display */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => !readonly && onChange(e.target.value)}
          readOnly={readonly}
          className={`
            w-full h-[60vh] p-4 font-mono text-sm resize-none
            focus:outline-none focus:ring-0
            ${theme === 'dark'
              ? 'bg-[#1e1e1e] text-[#d4d4d4]'
              : 'bg-white text-[#1e1e1e]'
            }
            ${readonly ? 'cursor-default' : 'cursor-text'}
          `}
          spellCheck={false}
          placeholder="No configuration available"
        />
        {readonly && (
          <div className="absolute top-2 right-2">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Read-only
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Map component type from API to parser type
 */
function mapComponentType(
  apiType: string,
): "receiver" | "processor" | "exporter" {
  if (apiType === "receiver") {
    return "receiver";
  }
  if (apiType === "processor") {
    return "processor";
  }
  if (apiType === "exporter") {
    return "exporter";
  }
  return "receiver";
}

/**
 * Aggregate metrics across multiple pipeline types
 */
function aggregateMetrics(metrics: ComponentMetrics[]): ComponentMetrics {
  const aggregated: ComponentMetrics = {
    component_type: metrics[0].component_type,
    component_name: metrics[0].component_name,
    pipeline_type: "all",
    throughput: 0,
    errors: 0,
    error_rate: 0,
    received: 0,
    accepted: 0,
    refused: 0,
    dropped: 0,
    sent: 0,
    send_failed: 0,
    last_updated: metrics[0].last_updated,
  };

  metrics.forEach((m) => {
    aggregated.throughput += m.throughput;
    aggregated.errors += m.errors;
    aggregated.received = (aggregated.received || 0) + (m.received || 0);
    aggregated.accepted = (aggregated.accepted || 0) + (m.accepted || 0);
    aggregated.refused = (aggregated.refused || 0) + (m.refused || 0);
    aggregated.dropped = (aggregated.dropped || 0) + (m.dropped || 0);
    aggregated.sent = (aggregated.sent || 0) + (m.sent || 0);
    aggregated.send_failed =
      (aggregated.send_failed || 0) + (m.send_failed || 0);
  });

  if (aggregated.throughput > 0) {
    aggregated.error_rate = (aggregated.errors / aggregated.throughput) * 100;
  }

  return aggregated;
}

/**
 * Format metrics text for inline display
 */
function formatMetricsTextCompact(metrics: ComponentMetrics): string {
  const parts: string[] = [];
  parts.push(`${formatThroughput(metrics.throughput)}`);
  if (metrics.error_rate > 0) {
    parts.push(`err: ${formatErrorRate(metrics.error_rate)}`);
  }
  return parts.join(" • ");
}
