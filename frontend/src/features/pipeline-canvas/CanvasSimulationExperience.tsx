import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Boxes, GitBranch, Workflow } from "lucide-react";
import { EventLog } from "./canvas/EventLog";
import { NodePalette } from "./canvas/NodePalette";
import { PipelineCanvas } from "./canvas/PipelineCanvas";
import { PropertiesPanel } from "./canvas/PropertiesPanel";
import { ScoreOverlay } from "./canvas/ScoreOverlay";
import { SubmitPanel } from "./canvas/SubmitPanel";
import { gameModeConfigs, type GameModeId } from "./config";
import { useGraphStore } from "./hooks/useGraphStore";

interface CanvasSimulationExperienceProps {
  initialModeId?: GameModeId;
}

function CanvasSimulationInner({ initialModeId = "rag-builder" }: CanvasSimulationExperienceProps) {
  const config = useGraphStore((state) => state.config);
  const setConfig = useGraphStore((state) => state.setConfig);

  useEffect(() => {
    const nextConfig = gameModeConfigs.find((item) => item.id === initialModeId) ?? gameModeConfigs[0];
    if (nextConfig.id !== config.id) {
      setConfig(nextConfig);
    }
  }, [config.id, initialModeId, setConfig]);

  return (
    <div className="space-y-5">
      <header className="rounded-lg border border-white/8 bg-[#101820]/88 px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#66FCF1]/20 bg-[#0B0C10] shadow-[0_0_30px_rgba(102,252,241,0.16)]">
              <Workflow className="h-6 w-6 text-[#66FCF1]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#45A29E]">EngineerVerse Canvas</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                {config.challengeMeta.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#C5C6C7]/68">
                {config.challengeMeta.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {gameModeConfigs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setConfig(item)}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                  item.id === config.id
                    ? "border-[#66FCF1]/50 bg-[#66FCF1]/12 text-white"
                    : "border-white/10 bg-[#0B0C10] text-[#C5C6C7]/72 hover:border-[#66FCF1]/35 hover:text-white"
                }`}
              >
                <Boxes className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="grid min-h-0 gap-5 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <NodePalette />

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/8 bg-[#101820] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-[#C5C6C7]/70">
              <GitBranch className="h-4 w-4 text-[#66FCF1]" />
              <span>{config.label}</span>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-[#45A29E]">
              Snap {config.canvasSettings.gridSize}px / Config-driven
            </div>
          </div>
          <PipelineCanvas />
        </div>

        <div className="space-y-5">
          <PropertiesPanel />
          <EventLog />
          <ScoreOverlay />
          <SubmitPanel />
        </div>
      </section>
    </div>
  );
}

export function CanvasSimulationExperience(props: CanvasSimulationExperienceProps) {
  return (
    <ReactFlowProvider>
      <CanvasSimulationInner {...props} />
    </ReactFlowProvider>
  );
}
