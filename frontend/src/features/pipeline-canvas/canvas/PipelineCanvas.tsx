import { useMemo, type DragEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { ConfigurableNode } from "./ConfigurableNode";
import { useGraphStore } from "../hooks/useGraphStore";

export function PipelineCanvas() {
  const { screenToFlowPosition } = useReactFlow();
  const config = useGraphStore((state) => state.config);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const onNodesChange = useGraphStore((state) => state.onNodesChange);
  const onEdgesChange = useGraphStore((state) => state.onEdgesChange);
  const onConnect = useGraphStore((state) => state.onConnect);
  const addNode = useGraphStore((state) => state.addNode);
  const selectNode = useGraphStore((state) => state.selectNode);
  const nodeTypes = useMemo(() => ({ configurableNode: ConfigurableNode }), []);
  const dropNode = (event: DragEvent) => {
    event.preventDefault();
    const nodeTypeId =
      event.dataTransfer.getData("application/pipeline-node") ||
      event.dataTransfer.getData("application/reactflow") ||
      event.dataTransfer.getData("text/plain");
    const nodeDef = config.nodeRegistry.find((item) => item.id === nodeTypeId);
    if (!nodeDef) return;
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    addNode(nodeDef, position);
  };

  return (
    <ReactFlow
      className="h-[680px] min-h-[680px] rounded-lg border border-white/8 bg-[#0B0C10]"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => selectNode(node.id)}
      onPaneClick={() => selectNode(null)}
      onDrop={dropNode}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      fitView
      minZoom={config.canvasSettings.minZoom}
      maxZoom={config.canvasSettings.maxZoom}
      snapToGrid={config.canvasSettings.snapToGrid}
      snapGrid={[config.canvasSettings.gridSize, config.canvasSettings.gridSize]}
    >
      <Background
        color={config.theme.gridColor}
        gap={config.canvasSettings.gridSize}
        variant={BackgroundVariant.Lines}
      />
      <MiniMap
        pannable
        zoomable
        nodeColor={(node) => {
          const nodeDef = config.nodeRegistry.find((item) => item.id === node.data.nodeTypeId);
          return nodeDef ? config.theme.nodeColors[nodeDef.category] ?? config.theme.accent : config.theme.accent;
        }}
        maskColor="rgba(11, 12, 16, 0.68)"
        className="!bg-[#101820] !border !border-white/10"
      />
      <Controls position="bottom-left" />
    </ReactFlow>
  );
}
