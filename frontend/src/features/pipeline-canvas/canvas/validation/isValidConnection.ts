import type { Connection, Edge, Node } from "@xyflow/react";
import type { GameModeConfig, HandleDef, NodeTypeDef } from "../../types/config.types";
import type { PipelineNodeData } from "../../types/graph.types";

function getNodeDef(node: Node<PipelineNodeData> | undefined, config: GameModeConfig): NodeTypeDef | undefined {
  if (!node) return undefined;
  return config.nodeRegistry.find((nodeDef) => nodeDef.id === node.data.nodeTypeId);
}

function getHandle(handles: HandleDef[], handleId: string | null | undefined): HandleDef | undefined {
  return handles.find((handle) => handle.id === handleId);
}

export function isValidConnection(
  connection: Connection,
  nodes: Array<Node<PipelineNodeData>>,
  edges: Edge[],
  config: GameModeConfig
) {
  if (!connection.source || !connection.target || connection.source === connection.target) {
    return false;
  }

  const duplicate = edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      edge.sourceHandle === connection.sourceHandle &&
      edge.targetHandle === connection.targetHandle
  );
  if (duplicate) return false;

  const sourceDef = getNodeDef(
    nodes.find((node) => node.id === connection.source),
    config
  );
  const targetDef = getNodeDef(
    nodes.find((node) => node.id === connection.target),
    config
  );

  if (!sourceDef || !targetDef) return false;

  const allowedCategories = config.connectionRules[sourceDef.category] ?? [];
  if (!allowedCategories.includes(targetDef.category)) return false;

  const sourceHandle = getHandle(sourceDef.outputs, connection.sourceHandle);
  const targetHandle = getHandle(targetDef.inputs, connection.targetHandle);

  return Boolean(sourceHandle && targetHandle && sourceHandle.dataType === targetHandle.dataType);
}
