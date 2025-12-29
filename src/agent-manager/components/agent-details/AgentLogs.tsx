import React from "react";
import { TelemetryLogsView } from "@agent-manager/components/shared/TelemetryLogsView";

interface AgentLogsProps {
  agentId: string;
}

export function AgentLogs({ agentId }: AgentLogsProps) {
  return <TelemetryLogsView agentId={agentId} title="Agent Logs" />;
}
