import React from "react";
import { TelemetryLogsView } from "@agent-manager/components/shared/TelemetryLogsView";

interface GroupLogsProps {
  groupId: string;
}

export function GroupLogs({ groupId }: GroupLogsProps) {
  return <TelemetryLogsView groupId={groupId} title="Group Logs" showAgentId />;
}
