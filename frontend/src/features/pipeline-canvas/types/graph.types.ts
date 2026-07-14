import type { Node } from "@xyflow/react";

export type NodeRunStatus = "idle" | "running" | "success" | "error";

export interface PipelineNodeData extends Record<string, unknown> {
  nodeTypeId: string;
  values: Record<string, unknown>;
  status: NodeRunStatus;
}

export type PipelineNode = Node<PipelineNodeData, "configurableNode">;

export interface SubmitPipelinePayload {
  gameModeId: string;
  challengeId: string;
  userId: string;
  input?: {
    documentName?: string;
    documentText?: string;
    datasetId?: string;
    schemaHint?: string;
    query?: string;
  };
  graph: {
    nodes: Array<{
      id: string;
      type: string;
      data: {
        values: Record<string, unknown>;
      };
      position: {
        x: number;
        y: number;
      };
    }>;
    edges: Array<{
      id: string;
      source: string;
      sourceHandle: string | null;
      target: string;
      targetHandle: string | null;
    }>;
  };
}

export interface SimulationTraceStep {
  nodeId: string;
  status: "success" | "error";
  timestampMs: number;
  durationMs?: number;
  activeMessage: string;
  completedMessage: string;
}

export interface EventLogEntry {
  id: string;
  nodeId: string;
  nodeLabel: string;
  status: "running" | "success" | "error";
  message: string;
  timestamp: string;
}

export interface SubmitPipelineResponse {
  submissionId: string;
  status: "completed" | "running" | "failed";
  score: {
    overall: number;
    metrics: Record<string, number>;
  };
  trace: SimulationTraceStep[];
  leaderboardRank: number;
  agentResult?: import("../../../types").AgentRunResponse;
}
