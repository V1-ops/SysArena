import type { Edge, Node } from "@xyflow/react";
import type { GameModeConfig } from "../types/config.types";
import type { PipelineNodeData, SubmitPipelinePayload } from "../types/graph.types";

export function serializeGraph(
  nodes: Array<Node<PipelineNodeData>>,
  edges: Edge[],
  config: GameModeConfig,
  userId = "demo-user",
  input?: SubmitPipelinePayload["input"]
): SubmitPipelinePayload {
  return {
    gameModeId: config.id,
    challengeId: config.challengeMeta.challengeId,
    userId,
    input,
    graph: {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.nodeTypeId,
        data: {
          values: node.data.values,
        },
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle ?? null,
        target: edge.target,
        targetHandle: edge.targetHandle ?? null,
      })),
    },
  };
}
