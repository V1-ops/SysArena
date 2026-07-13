import { Settings2 } from "lucide-react";
import { useGraphStore } from "../hooks/useGraphStore";

export function PropertiesPanel() {
  const config = useGraphStore((state) => state.config);
  const nodes = useGraphStore((state) => state.nodes);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0];
  const nodeDef = selectedNode
    ? config.nodeRegistry.find((item) => item.id === selectedNode.data.nodeTypeId)
    : undefined;

  return (
    <section className="rounded-lg border border-white/8 bg-[#101820]">
      <div className="flex items-center gap-2 border-b border-white/8 p-4">
        <Settings2 className="h-4 w-4 text-[#66FCF1]" />
        <p className="text-sm font-semibold text-white">Properties</p>
      </div>

      {selectedNode && nodeDef ? (
        <div className="space-y-4 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#45A29E]">Selected</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{nodeDef.label}</h2>
            <p className="mt-2 text-sm leading-6 text-[#C5C6C7]/65">{nodeDef.description}</p>
          </div>

          <div className="rounded-lg border border-white/8 bg-[#0B0C10] p-3">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#45A29E]">Handles</p>
            <div className="space-y-3 text-xs text-[#C5C6C7]/70">
              <div>
                <p className="mb-1 font-medium text-white">Inputs</p>
                {nodeDef.inputs.length ? (
                  nodeDef.inputs.map((handle) => <p key={handle.id}>{handle.label}: {handle.dataType}</p>)
                ) : (
                  <p>No inputs</p>
                )}
              </div>
              <div>
                <p className="mb-1 font-medium text-white">Outputs</p>
                {nodeDef.outputs.length ? (
                  nodeDef.outputs.map((handle) => <p key={handle.id}>{handle.label}: {handle.dataType}</p>)
                ) : (
                  <p>No outputs</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#66FCF1]/10 bg-[#0B0C10] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#45A29E]">Values</p>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-5 text-[#C5C6C7]/70">
              {JSON.stringify(selectedNode.data.values, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-4 text-sm text-[#C5C6C7]/65">Drop or select a node to inspect it.</div>
      )}
    </section>
  );
}
