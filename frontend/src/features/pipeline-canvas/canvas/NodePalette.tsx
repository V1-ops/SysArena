import { GripVertical } from "lucide-react";
import { NodeIcon } from "../lib/icons";
import { useGraphStore } from "../hooks/useGraphStore";

export function NodePalette() {
  const config = useGraphStore((state) => state.config);
  const allowedNodes = config.nodeRegistry.filter((nodeDef) =>
    config.challengeMeta.allowedNodeTypeIds.includes(nodeDef.id)
  );

  return (
    <aside className="flex min-h-0 flex-col rounded-lg border border-white/8 bg-[#101820]">
      <div className="border-b border-white/8 p-4">
        <p className="text-sm font-semibold text-white">Node Palette</p>
        <p className="mt-1 text-xs leading-5 text-[#C5C6C7]/60">Drag components into the canvas.</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        {allowedNodes.map((nodeDef) => (
          <div
            key={nodeDef.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/pipeline-node", nodeDef.id);
              event.dataTransfer.setData("application/reactflow", nodeDef.id);
              event.dataTransfer.setData("text/plain", nodeDef.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            className="group cursor-grab rounded-lg border border-white/8 bg-[#0B0C10] p-3 transition hover:border-[#66FCF1]/30 hover:bg-[#111A22] active:cursor-grabbing"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#66FCF1]/15 bg-[#1F2833]">
                <NodeIcon name={nodeDef.icon} className="h-4 w-4 text-[#66FCF1]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-white">{nodeDef.label}</p>
                  <GripVertical className="h-4 w-4 text-[#C5C6C7]/30 transition group-hover:text-[#66FCF1]" />
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#C5C6C7]/58">{nodeDef.description}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#45A29E]">{nodeDef.category}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
