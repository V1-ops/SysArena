import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { ArrowLeft, GitBranch, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import { EventLog } from "./canvas/EventLog";
import { AgentControlRoom } from "./canvas/AgentControlRoom";
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
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-[0.24em] text-[#45A29E]">Active challenge</p>
                <span className="rounded-full border border-[#66FCF1]/20 bg-[#66FCF1]/8 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#66FCF1]">Locked to route</span>
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl">
                {config.challengeMeta.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#C5C6C7]/68">
                {config.challengeMeta.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/challenges" className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-[#0B0C10] px-3 py-2 text-sm text-[#C5C6C7]/72 transition hover:border-[#66FCF1]/35 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Change challenge
            </Link>
          </div>
        </div>
      </header>

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
