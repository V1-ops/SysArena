import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { NodeIcon } from "../lib/icons";
import { useGraphStore } from "../hooks/useGraphStore";
import type { ConfigFieldDef, HandleDef } from "../types/config.types";
import type { PipelineNode } from "../types/graph.types";

const statusStyles = {
  idle: "border-white/10",
  running: "border-[#66FCF1]/70 shadow-[0_0_35px_rgba(102,252,241,0.2)]",
  success: "border-[#45A29E]/80",
  degraded: "border-amber-300/80 shadow-[0_0_35px_rgba(245,158,11,0.14)]",
  skipped: "border-white/25 opacity-70",
  error: "border-red-400/70",
};

function handleTop(index: number, total: number) {
  return `${((index + 1) / (total + 1)) * 100}%`;
}

function NodeHandle({
  handle,
  index,
  total,
  type,
}: {
  handle: HandleDef;
  index: number;
  total: number;
  type: "source" | "target";
}) {
  return (
    <Handle
      id={handle.id}
      type={type}
      position={type === "source" ? Position.Right : Position.Left}
      style={{ top: handleTop(index, total) }}
      title={`${handle.label}: ${handle.dataType}`}
    />
  );
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: ConfigFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const baseClass =
    "w-full rounded-md border border-white/10 bg-[#0B0C10] px-2 py-1.5 text-xs text-[#C5C6C7] outline-none transition focus:border-[#66FCF1]/60";

  if (field.type === "select") {
    return (
      <select className={baseClass} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "toggle") {
    return (
      <button
        type="button"
        className={`h-7 w-12 rounded-full border px-1 transition ${
          value ? "border-[#66FCF1]/50 bg-[#66FCF1]/20" : "border-white/10 bg-[#0B0C10]"
        }`}
        onClick={() => onChange(!value)}
        aria-pressed={Boolean(value)}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-[#C5C6C7] transition ${
            value ? "translate-x-5 bg-[#66FCF1]" : "translate-x-0"
          }`}
        />
      </button>
    );
  }

  if (field.type === "slider") {
    return (
      <div className="space-y-1">
        <input
          className="w-full accent-[#66FCF1]"
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={Number(value ?? field.default)}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <div className="text-right text-[10px] text-[#66FCF1]">{String(value ?? field.default)}</div>
      </div>
    );
  }

  return (
    <input
      className={baseClass}
      type={field.type === "number" ? "number" : "text"}
      min={field.min}
      max={field.max}
      step={field.step}
      value={String(value ?? "")}
      onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)}
    />
  );
}

export function ConfigurableNode({ id, data, selected }: NodeProps<PipelineNode>) {
  const config = useGraphStore((state) => state.config);
  const updateNodeValue = useGraphStore((state) => state.updateNodeValue);
  const nodeDef = config.nodeRegistry.find((item) => item.id === data.nodeTypeId);

  if (!nodeDef) {
    return (
      <div className="w-[260px] rounded-lg border border-red-400/60 bg-[#1F2833] p-4 text-sm text-red-100">
        Unknown node: {data.nodeTypeId}
      </div>
    );
  }

  return (
    <div
      className={`w-[280px] rounded-lg border bg-[#101820] text-[#C5C6C7] shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition ${
        statusStyles[data.status]
      } ${selected ? "ring-2 ring-[#66FCF1]/50" : ""}`}
    >
      {nodeDef.inputs.map((handle, index) => (
        <NodeHandle key={handle.id} handle={handle} index={index} total={nodeDef.inputs.length} type="target" />
      ))}
      {nodeDef.outputs.map((handle, index) => (
        <NodeHandle key={handle.id} handle={handle} index={index} total={nodeDef.outputs.length} type="source" />
      ))}

      <div className="border-b border-white/8 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#66FCF1]/20 bg-[#0B0C10]">
            <NodeIcon name={nodeDef.icon} className="h-4 w-4 text-[#66FCF1]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-white">{nodeDef.label}</p>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: config.theme.nodeColors[nodeDef.category] ?? config.theme.accent }}
              />
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#C5C6C7]/65">{nodeDef.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {nodeDef.configFields.map((field) => (
          <label key={field.name} className="block space-y-1.5">
            <span className="text-[11px] uppercase tracking-[0.16em] text-[#45A29E]">{field.label}</span>
            <FieldEditor
              field={field}
              value={data.values[field.name]}
              onChange={(value) => updateNodeValue(id, field.name, value)}
            />
          </label>
        ))}
      </div>

      {data.status !== "idle" && (
        <div className="flex items-center gap-2 border-t border-white/8 px-4 py-2 text-xs text-[#C5C6C7]/75">
          {data.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#66FCF1]" />}
          {data.status === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-[#45A29E]" />}
          {(data.status === "degraded" || data.status === "skipped" || data.status === "error") && <AlertCircle className={`h-3.5 w-3.5 ${data.status === "degraded" ? "text-amber-300" : data.status === "skipped" ? "text-[#C5C6C7]/50" : "text-red-300"}`} />}
          <span className="capitalize">{data.status}</span>
        </div>
      )}
    </div>
  );
}
