import { Settings2 } from "lucide-react";
import { useGraphStore } from "../hooks/useGraphStore";

interface PropertiesPanelProps {
  embedded?: boolean;
}

export function PropertiesPanel({ embedded = false }: PropertiesPanelProps) {
  const config = useGraphStore((state) => state.config);
  const nodes = useGraphStore((state) => state.nodes);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const updateNodeValue = useGraphStore((state) => state.updateNodeValue);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0];
  const nodeDef = selectedNode
    ? config.nodeRegistry.find((item) => item.id === selectedNode.data.nodeTypeId)
    : undefined;

  const content = selectedNode && nodeDef ? (
    <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#45A29E]">Selected</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{nodeDef.label}</h2>
            <p className="mt-2 text-sm leading-6 text-[#C5C6C7]/65">{nodeDef.description}</p>
          </div>

          {nodeDef.configFields.length > 0 && (
            <div className="space-y-3 rounded-lg border border-[#66FCF1]/10 bg-[#0B0C10] p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#45A29E]">Configuration</p>
              {nodeDef.configFields.map((field) => {
                const value = selectedNode.data.values[field.name] ?? field.default;
                const common = "mt-1 w-full rounded-md border border-white/10 bg-[#101820] px-2.5 py-2 text-xs text-[#C5C6C7] outline-none transition focus:border-[#66FCF1]/50";
                if (field.type === "toggle") {
                  return <label key={field.name} className="flex items-center justify-between gap-3 text-xs text-[#C5C6C7]/75"><span>{field.label}</span><input type="checkbox" checked={Boolean(value)} onChange={(event) => updateNodeValue(selectedNode.id, field.name, event.target.checked)} className="h-4 w-4 accent-[#66FCF1]" /></label>;
                }
                if (field.type === "select") {
                  return <label key={field.name} className="block text-xs text-[#C5C6C7]/75"><span>{field.label}</span><select value={String(value)} onChange={(event) => updateNodeValue(selectedNode.id, field.name, event.target.value)} className={common}>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
                }
                if (field.type === "slider") {
                  return <label key={field.name} className="block text-xs text-[#C5C6C7]/75"><span className="flex justify-between"><span>{field.label}</span><span className="text-[#66FCF1]">{String(value)}</span></span><input type="range" min={field.min} max={field.max} step={field.step} value={Number(value)} onChange={(event) => updateNodeValue(selectedNode.id, field.name, Number(event.target.value))} className="mt-2 w-full accent-[#66FCF1]" /></label>;
                }
                return <label key={field.name} className="block text-xs text-[#C5C6C7]/75"><span>{field.label}</span><input type={field.type === "number" ? "number" : "text"} min={field.min} max={field.max} step={field.step} value={String(value)} onChange={(event) => updateNodeValue(selectedNode.id, field.name, field.type === "number" ? Number(event.target.value) : event.target.value)} className={common} /></label>;
              })}
            </div>
          )}

          <div className="rounded-lg border border-white/8 bg-[#0B0C10] p-3">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#45A29E]">Handles</p>
            <div className="space-y-3 text-xs text-[#C5C6C7]/70">
              <div><p className="mb-1 font-medium text-white">Inputs</p>{nodeDef.inputs.length ? nodeDef.inputs.map((handle) => <p key={handle.id}>{handle.label}: {handle.dataType}</p>) : <p>No inputs</p>}</div>
              <div><p className="mb-1 font-medium text-white">Outputs</p>{nodeDef.outputs.length ? nodeDef.outputs.map((handle) => <p key={handle.id}>{handle.label}: {handle.dataType}</p>) : <p>No outputs</p>}</div>
            </div>
          </div>
        </div>
  ) : <div className="rounded-lg border border-dashed border-white/10 bg-[#0B0C10] p-4 text-sm leading-6 text-[#C5C6C7]/65">Select a node on the canvas to inspect and configure it.</div>;

  if (embedded) return content;

  return (
    <section className="rounded-lg border border-white/8 bg-[#101820]">
      <div className="flex items-center gap-2 border-b border-white/8 p-4">
        <Settings2 className="h-4 w-4 text-[#66FCF1]" />
        <p className="text-sm font-semibold text-white">Properties</p>
      </div>
      <div className="p-4">{content}</div>
    </section>
  );
}
