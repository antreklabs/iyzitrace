import React from "react";
import { TelemetryMetricsView } from "@agent-manager/components/shared/TelemetryMetricsView";

interface GroupMetricsProps {
  groupId: string;
}

export function GroupMetrics({ groupId }: GroupMetricsProps) {
  return <TelemetryMetricsView groupId={groupId} showAgentId />;
}
