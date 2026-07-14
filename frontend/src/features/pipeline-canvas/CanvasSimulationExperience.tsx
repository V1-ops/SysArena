import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Boxes, GitBranch, Lightbulb, Workflow } from "lucide-react";
import { AgentControlRoom } from "./canvas/AgentControlRoom";
import { EventLog } from "./canvas/EventLog";
import { NodePalette } from "./canvas/NodePalette";
import { PipelineCanvas } from "./canvas/PipelineCanvas";
import { PropertiesPanel } from "./canvas/PropertiesPanel";
import { ScoreOverlay } from "./canvas/ScoreOverlay";
import { SubmitPanel } from "./canvas/SubmitPanel";
import { gameModeConfigs, type GameModeId } from "./config";
import { useGraphStore } from "./hooks/useGraphStore";
import type { GameModeConfig } from "./types/config.types";

interface CanvasSimulationExperienceProps {
  initialModeId?: GameModeId;
  challengeMetaOverride?: Partial<GameModeConfig["challengeMeta"]>;
}

function CanvasSimulationInner({
  initialModeId = "rag-builder",
  challengeMetaOverride,
}: CanvasSimulationExperienceProps) {
  const config = useGraphStore((state) => state.config);
  const setConfig = useGraphStore((state) => state.setConfig);

  useEffect(() => {
    const baseConfig = gameModeConfigs.find((item) => item.id === initialModeId) ?? gameModeConfigs[0];
    const nextConfig = challengeMetaOverride
      ? {
          ...baseConfig,
          challengeMeta: {
            ...baseConfig.challengeMeta,
            ...challengeMetaOverride,
          },
        }
      : baseConfig;

    const hasChanged =
      nextConfig.id !== config.id ||
      nextConfig.challengeMeta.challengeId !== config.challengeMeta.challengeId ||
      nextConfig.challengeMeta.title !== config.challengeMeta.title ||
      nextConfig.challengeMeta.description !== config.challengeMeta.description;

    if (hasChanged) {
      setConfig(nextConfig);
    }
  }, [challengeMetaOverride, config, initialModeId, setConfig]);

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

      {(config.challengeMeta.hint || config.challengeMeta.sourceLabel) && (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          {config.challengeMeta.hint && (
            <div className="flex items-start gap-3 rounded-lg border border-[#66FCF1]/15 bg-[#101820] px-4 py-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#66FCF1]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#66FCF1]">Hint</p>
                <p className="mt-1 text-sm leading-6 text-[#C5C6C7]/75">{config.challengeMeta.hint}</p>
              </div>
            </div>
          )}
          {config.challengeMeta.sourceLabel && (
            <div className="rounded-lg border border-[#45A29E]/20 bg-[#101820] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#45A29E]">Challenge source</p>
              <p className="mt-1 text-sm text-white">{config.challengeMeta.sourceLabel}</p>
              <p className="mt-1 text-xs leading-5 text-[#C5C6C7]/60">The document is already loaded. Your job is to design the pipeline that processes it.</p>
            </div>
          )}
        </section>
      )}

      <section className={`grid min-h-0 gap-5 ${config.id === "agent-builder" ? "xl:grid-cols-[300px_minmax(0,1fr)_420px]" : "xl:grid-cols-[300px_minmax(0,1fr)_340px]"}`}>
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

        {config.id === "agent-builder" ? (
          <AgentControlRoom />
        ) : (
          <div className="space-y-5">
            <PropertiesPanel />
            <EventLog />
            <ScoreOverlay />
            <SubmitPanel />
          </div>
        )}
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
