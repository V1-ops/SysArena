import { useCallback } from "react";
import { useGraphStore } from "./useGraphStore";
import type { SimulationTraceStep } from "../types/graph.types";

export function useSimulationTrace() {
  const setNodeStatus = useGraphStore((state) => state.setNodeStatus);
  const setActiveEdgeTarget = useGraphStore((state) => state.setActiveEdgeTarget);
  const setRunState = useGraphStore((state) => state.setRunState);
  const appendEvent = useGraphStore((state) => state.appendEvent);
  const resetNodeStatuses = useGraphStore((state) => state.resetNodeStatuses);
  const nodes = useGraphStore((state) => state.nodes);
  const config = useGraphStore((state) => state.config);

  return useCallback(
    async (trace: SimulationTraceStep[]) => {
      resetNodeStatuses();
      setRunState("running");
      for (const step of trace) {
        const node = nodes.find((item) => item.id === step.nodeId);
        const nodeDef = config.nodeRegistry.find((item) => item.id === node?.data.nodeTypeId);
        const nodeLabel = nodeDef?.label ?? step.nodeId;
        setActiveEdgeTarget(step.nodeId);
        setNodeStatus(step.nodeId, "running");
        appendEvent({
          nodeId: step.nodeId,
          nodeLabel,
          status: "running",
          message: step.activeMessage,
        });
        await new Promise((resolve) => window.setTimeout(resolve, step.durationMs ?? 800));
        setNodeStatus(step.nodeId, step.status);
        appendEvent({
          nodeId: step.nodeId,
          nodeLabel,
          status: step.status,
          message: step.completedMessage,
        });
      }
      setActiveEdgeTarget(null);
      setRunState("completed");
    },
    [appendEvent, config.nodeRegistry, nodes, resetNodeStatuses, setActiveEdgeTarget, setNodeStatus, setRunState]
  );
}
