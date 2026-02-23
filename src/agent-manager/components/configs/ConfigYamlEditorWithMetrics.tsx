import React, { useEffect, useState, useRef, useCallback } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-yaml';

import { useTheme } from "../ThemeProvider";

import { type ComponentMetrics } from "@agent-manager/api/collector-metrics";
import {
  parseYamlComponents,
  formatThroughput,
  formatErrorRate,
  type YamlComponent,
} from "@agent-manager/utils/yaml-parser";

// Prism dark theme styles (VS Code-like)
const prismDarkStyles = `
.token.comment { color: #6a9955; }
.token.string { color: #ce9178; }
.token.number { color: #b5cea8; }
.token.boolean { color: #569cd6; }
.token.null { color: #569cd6; }
.token.keyword { color: #569cd6; }
.token.key { color: #9cdcfe; }
.token.punctuation { color: #d4d4d4; }
.token.atrule { color: #c586c0; }
.token.important { color: #569cd6; }
`;

// Prism light theme styles
const prismLightStyles = `
.token.comment { color: #008000; }
.token.string { color: #a31515; }
.token.number { color: #098658; }
.token.boolean { color: #0000ff; }
.token.null { color: #0000ff; }
.token.keyword { color: #0000ff; }
.token.key { color: #001080; }
.token.punctuation { color: #000000; }
.token.atrule { color: #af00db; }
.token.important { color: #0000ff; }
`;

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
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const { theme } = useTheme();

  // Parse YAML to find components whenever value changes
  useEffect(() => {
    if (value) {
      const components = parseYamlComponents(value);
      setParsedComponents(components);
    }
  }, [value]);

  // Highlight code
  const highlightedCode = React.useMemo(() => {
    if (!value) {
      return '';
    }
    try {
      return Prism.highlight(value, Prism.languages.yaml, 'yaml');
    } catch {
      return value;
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

  // Sync scroll between textarea and pre
  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Generate line numbers
  const lineNumbers = React.useMemo(() => {
    const lines = value.split('\n');
    return lines.map((_, i) => i + 1);
  }, [value]);

  const isDark = theme === 'dark';

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Inject Prism styles */}
      <style>{isDark ? prismDarkStyles : prismLightStyles}</style>

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

      {/* Code Editor with Syntax Highlighting */}
      <div
        className="relative flex"
        style={{
          backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
          height: '60vh',
        }}
      >
        {/* Line Numbers */}
        <div
          className="flex-shrink-0 select-none text-right pr-3 pt-4 pb-4 overflow-hidden"
          style={{
            color: isDark ? '#858585' : '#999999',
            backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            width: '50px',
            borderRight: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
          }}
        >
          {lineNumbers.map((num) => (
            <div key={num} className="am-line-num">{num}</div>
          ))}
        </div>

        {/* Editor Container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Highlighted Code Display (background layer) */}
          <pre
            ref={preRef}
            className="absolute inset-0 m-0 p-4 overflow-auto pointer-events-none"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              color: isDark ? '#d4d4d4' : '#1e1e1e',
              whiteSpace: 'pre',
              wordWrap: 'normal',
            }}
            dangerouslySetInnerHTML={{ __html: highlightedCode || '&nbsp;' }}
          />

          {/* Transparent Textarea (foreground layer for editing) */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => !readonly && onChange(e.target.value)}
            onScroll={handleScroll}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            readOnly={readonly}
            className="absolute inset-0 m-0 p-4 resize-none border-0 outline-none"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              color: 'transparent',
              caretColor: isDark ? '#d4d4d4' : '#1e1e1e',
              backgroundColor: 'transparent',
              whiteSpace: 'pre',
              wordWrap: 'normal',
              overflow: 'auto',
            }}
            spellCheck={false}
            placeholder="No configuration available"
          />
        </div>

        {/* Read-only Badge */}
        {readonly && (
          <div className="absolute top-2 right-2 z-10">
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: isDark ? '#333' : '#e0e0e0',
                color: isDark ? '#999' : '#666',
              }}
            >
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
