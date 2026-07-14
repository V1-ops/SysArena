import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type EdgeChange, type NodeChange, type XYPosition } from "@xyflow/react";
import { create } from "zustand";
import { ragBuilderConfig } from "../config/ragBuilderConfig";
import type { GameModeConfig, NodeTypeDef } from "../types/config.types";
import type { NodeRunStatus, PipelineNode, SubmitPipelineResponse } from "../types/graph.types";
import { getDefaultValues } from "../canvas/utils/nodeDefaults";
import { isValidConnection } from "../canvas/validation/isValidConnection";
import type { EventLogEntry } from "../types/graph.types";

type RunState = "idle" | "submitting" | "running" | "completed" | "error";

interface GraphStore {
  config: GameModeConfig;
  nodes: PipelineNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  runState: RunState;
  activeEdgeTarget: string | null;
  lastResponse: SubmitPipelineResponse | null;
  errorMessage: string | null;
  eventLog: EventLogEntry[];
  setConfig: (config: GameModeConfig) => void;
  onNodesChange: (changes: Array<NodeChange<PipelineNode>>) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (nodeDef: NodeTypeDef, position: XYPosition) => void;
  updateNodeValue: (nodeId: string, fieldName: string, value: unknown) => void;
  selectNode: (nodeId: string | null) => void;
  setNodeStatus: (nodeId: string, status: NodeRunStatus) => void;
  setActiveEdgeTarget: (nodeId: string | null) => void;
  setRunState: (runState: RunState) => void;
  setLastResponse: (response: SubmitPipelineResponse | null) => void;
  setErrorMessage: (message: string | null) => void;
  appendEvent: (entry: Omit<EventLogEntry, "id" | "timestamp">) => void;
  clearEventLog: () => void;
  resetNodeStatuses: () => void;
  resetGraph: () => void;
}

function makeNode(nodeDef: NodeTypeDef, position: XYPosition, index: number): PipelineNode {
  return {
    id: `${nodeDef.id}-${Date.now()}-${index}`,
    type: "configurableNode",
    position,
    data: {
      nodeTypeId: nodeDef.id,
      values: getDefaultValues(nodeDef),
      status: "idle",
    },
  };
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  config: ragBuilderConfig,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  runState: "idle",
  activeEdgeTarget: null,
  lastResponse: null,
  errorMessage: null,
  eventLog: [],
  setConfig: (config) =>
    set({
      config,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      runState: "idle",
      activeEdgeTarget: null,
      lastResponse: null,
      errorMessage: null,
      eventLog: [],
    }),
  onNodesChange: (changes) => set({ nodes: applyNodeChanges<PipelineNode>(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => {
    const { nodes, edges, config } = get();
    const isStructuralConnection = Boolean(
      connection.source &&
        connection.target &&
        connection.source !== connection.target &&
        !edges.some(
          (edge) =>
            edge.source === connection.source &&
            edge.target === connection.target &&
            edge.sourceHandle === connection.sourceHandle &&
            edge.targetHandle === connection.targetHandle
        )
    );

    if (!isStructuralConnection) {
      set({ errorMessage: "That edge is a duplicate or connects a node to itself." });
      return;
    }

    const isSemanticallyValid = isValidConnection(connection, nodes, edges, config);

    set({
      edges: addEdge(
        {
          ...connection,
          id: `${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
          animated: false,
          data: { isSemanticallyValid },
          style: isSemanticallyValid
            ? { stroke: config.theme.edgeColor, strokeWidth: 2 }
            : { stroke: "#F59E0B", strokeWidth: 2, strokeDasharray: "6 4" },
        },
        edges
      ),
      errorMessage: isSemanticallyValid
        ? null
        : "Warning: this connection is structurally allowed but does not match the recommended data flow. It will reduce your score when simulated.",
    });
  },
  addNode: (nodeDef, position) => {
    const { config, nodes } = get();
    if (config.challengeMeta.maxNodes && nodes.length >= config.challengeMeta.maxNodes) {
      set({ errorMessage: `This challenge allows up to ${config.challengeMeta.maxNodes} nodes.` });
      return;
    }
    set({ nodes: [...nodes, makeNode(nodeDef, position, nodes.length)], errorMessage: null });
  },
  updateNodeValue: (nodeId, fieldName, value) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                values: {
                  ...node.data.values,
                  [fieldName]: value,
                },
              },
            }
          : node
      ),
    }),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  setNodeStatus: (nodeId, status) =>
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                status,
              },
            }
          : node
      ),
    }),
  setActiveEdgeTarget: (nodeId) =>
    set({
      activeEdgeTarget: nodeId,
      edges: get().edges.map((edge) => ({
        ...edge,
        animated: nodeId ? edge.target === nodeId : false,
        style: {
          stroke: nodeId && edge.target === nodeId ? get().config.theme.edgeAnimatedColor : get().config.theme.edgeColor,
          strokeWidth: nodeId && edge.target === nodeId ? 3 : 2,
          ...(nodeId || edge.data?.isSemanticallyValid !== false
            ? {}
            : { stroke: "#F59E0B", strokeDasharray: "6 4" }),
        },
      })),
    }),
  setRunState: (runState) => set({ runState }),
  setLastResponse: (lastResponse) => set({ lastResponse }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  appendEvent: (entry) =>
    set({
      eventLog: [
        {
          ...entry,
          id: `${entry.nodeId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...get().eventLog,
      ].slice(0, 40),
    }),
  clearEventLog: () => set({ eventLog: [] }),
  resetNodeStatuses: () =>
    set({
      nodes: get().nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: "idle",
        },
      })),
      edges: get().edges.map((edge) => ({
        ...edge,
        animated: false,
        style:
          edge.data?.isSemanticallyValid === false
            ? { stroke: "#F59E0B", strokeWidth: 2, strokeDasharray: "6 4" }
            : { stroke: get().config.theme.edgeColor, strokeWidth: 2 },
      })),
    }),
  resetGraph: () =>
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      runState: "idle",
      activeEdgeTarget: null,
      lastResponse: null,
      errorMessage: null,
      eventLog: [],
    }),
}));
