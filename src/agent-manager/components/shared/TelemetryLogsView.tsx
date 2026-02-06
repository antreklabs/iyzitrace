import React, { useState, useEffect } from "react";
import { FileText, X } from "lucide-react";
import useSWR from "swr";

import { queryLogs, type LogData } from "@agent-manager/api/telemetry";
import { Badge } from "@agent-manager/components/ui/badge";
import { Button } from "@agent-manager/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@agent-manager/components/ui/card";
import { Input } from "@agent-manager/components/ui/input";
import { LoadingSpinner } from "@agent-manager/components/ui/loading-spinner";
import { ScrollArea } from "@agent-manager/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@agent-manager/components/ui/select";

interface TelemetryLogsViewProps {
  /**
   * Filter by agent ID
   */
  agentId?: string;
  /**
   * Filter by group ID
   */
  groupId?: string;
  /**
   * Title for the logs card
   */
  title?: string;
  /**
   * Whether to show agent ID in the logs list
   */
  showAgentId?: boolean;
}

/**
 * Reusable telemetry logs view component
 * Can display logs for either an agent or a group
 */
export function TelemetryLogsView({
  agentId,
  groupId,
  title,
  showAgentId = false,
}: TelemetryLogsViewProps) {
  const [logsData, setLogsData] = useState<LogData[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>(""); // User input (immediate)
  const [searchFilter, setSearchFilter] = useState<string>(""); // Debounced value for query
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h">("1h");

  // Debounce search input - only update searchFilter after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchFilter(searchInput);
    }, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const entityType = agentId ? "agent" : "group";
  const entityId = agentId || groupId;
  const displayTitle =
    title || `${entityType === "agent" ? "Agent" : "Group"} Logs`;

  // Convert time range to milliseconds
  const getTimeRangeMs = () => {
    switch (timeRange) {
      case "1h": return 60 * 60 * 1000;
      case "6h": return 6 * 60 * 60 * 1000;
      case "24h": return 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  };

  const { isLoading } = useSWR(
    `${entityType}-logs-${entityId}-${severityFilter}-${searchFilter}-${timeRange}`,
    async () => {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - getTimeRangeMs());

      const result = await queryLogs({
        ...(agentId && { agent_id: agentId }),
        ...(groupId && { group_id: groupId }),
        ...(severityFilter !== "all" && { severity: severityFilter }),
        ...(searchFilter && { search: searchFilter }),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        limit: 200,
      });
      setLogsData(result.logs || []);
      return result;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const getSeverityColor = (severity?: string) => {
    if (!severity) {
      return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800";
    }
    switch (severity.toUpperCase()) {
      case "ERROR":
      case "FATAL":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950";
      case "WARN":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950";
      case "INFO":
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950";
      case "DEBUG":
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800";
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800";
    }
  };

  const getSeverityOption = (value: string, label: string) => {
    const isAll = value === "all";
    return (
      <div className="flex items-center gap-2">
        {!isAll && (
          <Badge className={`text-xs ${getSeverityColor(value)}`}>
            {label}
          </Badge>
        )}
        {isAll && <span>{label}</span>}
      </div>
    );
  };

  const logCountText =
    logsData.length > 0
      ? `${logsData.length} logs in last ${timeRange}`
      : isLoading
        ? "Loading..."
        : "No logs available";

  const handleClearFilters = () => {
    setSeverityFilter("all");
    setSearchInput("");
    setSearchFilter("");
  };

  const hasActiveFilters = severityFilter !== "all" || searchInput !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {displayTitle}
        </CardTitle>
        <CardDescription>{logCountText}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Severity">
                  {severityFilter === "all" ? (
                    "All Severities"
                  ) : (
                    <Badge
                      className={`text-xs ${getSeverityColor(severityFilter)}`}
                    >
                      {severityFilter}
                    </Badge>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {getSeverityOption("all", "All Severities")}
                </SelectItem>
                <SelectItem value="error">
                  {getSeverityOption("error", "error")}
                </SelectItem>
                <SelectItem value="warn">
                  {getSeverityOption("warn", "warn")}
                </SelectItem>
                <SelectItem value="info">
                  {getSeverityOption("info", "info")}
                </SelectItem>
                <SelectItem value="debug">
                  {getSeverityOption("debug", "debug")}
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search logs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full"
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
            {/* Time range toggle */}
            <div className="flex rounded-lg border bg-muted p-0.5 ml-auto">
              {(["1h", "6h", "24h"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeRange === range
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px]">
          {logsData.map((log, idx) => {
            const logDate = new Date(log.timestamp);
            const timeString = logDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            });
            const dateString = logDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            // Parse log body to extract meaningful message
            let logMessage = log.body;
            let parsedBody: Record<string, unknown> | null = null;

            try {
              parsedBody = JSON.parse(log.body);
              // Try to get the actual log message from common fields
              if (typeof parsedBody === "object" && parsedBody !== null) {
                logMessage =
                  (parsedBody.body as string) ||
                  (parsedBody.message as string) ||
                  (parsedBody.msg as string) ||
                  log.body;
              }
            } catch {
              // Not JSON, use as-is
            }

            // Get source/component info
            const source = parsedBody?.["instrumentation_scope.name"] as string ||
              parsedBody?.scope_name as string ||
              parsedBody?.source as string ||
              "";

            return (
              <div key={idx} className="py-2 border-b last:border-0">
                <div className="flex items-start gap-2">
                  <Badge
                    className={`text-xs shrink-0 py-0 px-1.5 ${getSeverityColor(log.severity_text)}`}
                  >
                    {log.severity_text || "UNKNOWN"}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 font-mono">
                    {dateString} {timeString}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      {logMessage}
                    </div>
                    {source && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <span className="opacity-70">Source:</span> {source}
                      </div>
                    )}
                    {showAgentId && log.agent_id && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <span className="opacity-70">Agent:</span> {log.agent_id}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {logsData.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              No logs available
            </div>
          )}
          {isLoading && logsData.length === 0 && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
