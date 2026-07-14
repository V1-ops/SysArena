import { Play, RotateCcw, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGraphStore } from "../hooks/useGraphStore";
import { useSimulationTrace } from "../hooks/useSimulationTrace";
import { serializeGraph } from "../services/serializeGraph";
import { submitPipeline } from "../services/submitPipeline";
import { saveRagBuild, saveRagRun } from "../../../lib/rag-session";
import { runRagChallenge, validateBuild } from "../../../services/api";
import type { BuildEdge, BuildNode, RagRunResponse } from "../../../types";
import type { SimulationTraceStep, SubmitPipelineResponse } from "../types/graph.types";

function toBuildNodes(
  nodes: ReturnType<typeof useGraphStore.getState>["nodes"],
  configNodes: ReturnType<typeof useGraphStore.getState>["config"]["nodeRegistry"]
): BuildNode[] {
  return nodes.flatMap((node) => {
    const nodeDef = configNodes.find((item) => item.id === node.data.nodeTypeId);
    if (!nodeDef) return [];

    return [{
      id: node.id,
      type: node.data.nodeTypeId,
      label: nodeDef.label,
      values: node.data.values,
    }];
  });
}

function toBuildEdges(edges: ReturnType<typeof useGraphStore.getState>["edges"]): BuildEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
  }));
}

function toSimulationTrace(run: RagRunResponse, buildNodes: BuildNode[]): SimulationTraceStep[] {
  const labelToNodeId = new Map(buildNodes.map((node) => [node.label, node.id]));

  return run.simulationTimeline.flatMap((event) => {
    const nodeId = event.nodeId ?? labelToNodeId.get(event.label);
    if (!nodeId) return [];

    const successful = event.status === "completed" || event.status === "success";
    return [{
      nodeId,
      status: successful ? "success" : "error",
      timestampMs: event.startedAtOffsetMs,
      durationMs: event.durationMs,
      activeMessage: event.meta?.description
        ? String(event.meta.description)
        : `Running ${event.label}.`,
      completedMessage: successful ? `${event.label} completed.` : `${event.label} failed.`,
    }];
  });
}

function toOverlayResponse(run: RagRunResponse): SubmitPipelineResponse {
  const overallPoints = run.scoreBreakdown.reduce((sum, item) => sum + item.score, 0);
  const overallMax = run.scoreBreakdown.reduce((sum, item) => sum + item.maxScore, 0) || 100;

  return {
    submissionId: run.runId,
    status: run.status === "completed" ? "completed" : "running",
    score: {
      overall: overallPoints / overallMax,
      metrics: Object.fromEntries(
        run.scoreBreakdown.map((item) => [item.label, item.maxScore ? item.score / item.maxScore : 0])
      ),
    },
    trace: [],
    leaderboardRank: 0,
  };
}

export function SubmitPanel() {
  const navigate = useNavigate();
  const config = useGraphStore((state) => state.config);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const runState = useGraphStore((state) => state.runState);
  const errorMessage = useGraphStore((state) => state.errorMessage);
  const resetGraph = useGraphStore((state) => state.resetGraph);
  const setRunState = useGraphStore((state) => state.setRunState);
  const setLastResponse = useGraphStore((state) => state.setLastResponse);
  const lastResponse = useGraphStore((state) => state.lastResponse);
  const setErrorMessage = useGraphStore((state) => state.setErrorMessage);
  const clearEventLog = useGraphStore((state) => state.clearEventLog);
  const runSimulationTrace = useSimulationTrace();
  const isRag = config.id === "rag-builder";
  const sampleQueries = config.challengeMeta.sampleQueries ?? [];
  const [query, setQuery] = useState(sampleQueries[0] ?? "What is the meaning of business?");
  const [queryMode, setQueryMode] = useState<"sample" | "custom">("sample");
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isRag && sampleQueries.length > 0) {
      setQuery(sampleQueries[0]);
      setQueryMode("sample");
    }
  }, [config.challengeMeta.challengeId, isRag, sampleQueries]);

  async function handleSubmit() {
    try {
      if (isRag && !query.trim()) {
        setErrorMessage("Choose or enter a question before running the RAG simulation.");
        return;
      }

      setRunState("submitting");
      setErrorMessage(null);
      setValidationWarning(null);
      clearEventLog();

      const payload = serializeGraph(
        nodes,
        edges,
        config,
        "demo-user",
        isRag ? { query } : undefined
      );

      if (isRag) {
        const buildNodes = toBuildNodes(nodes, config.nodeRegistry);
        const buildEdges = toBuildEdges(edges);
        const validation = await validateBuild(config.challengeMeta.challengeId, buildNodes, buildEdges);

        if (!validation.isValid) {
          setValidationWarning(validation.feedback.join(" "));
        }

        const run = await runRagChallenge(config.challengeMeta.challengeId, buildNodes, buildEdges, query);
        saveRagBuild(payload);
        saveRagRun(run);

        const overlayResponse = toOverlayResponse(run);
        const trace = toSimulationTrace(run, buildNodes);
        setLastResponse({ ...overlayResponse, trace });
        await runSimulationTrace(trace);
        return;
      }

      const response = await submitPipeline(payload);
      setLastResponse(response);
      await runSimulationTrace(response.trace);
    } catch (error) {
      setRunState("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to run this simulation.");
    }
  }

  const busy = runState === "submitting" || runState === "running";

  return (
    <section className="rounded-lg border border-white/8 bg-[#101820] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Run Simulation</p>
          <p className="mt-1 text-xs leading-5 text-[#C5C6C7]/60">
            Build your graph, then watch the document move through every component.
          </p>
        </div>
        <Play className="h-5 w-5 text-[#66FCF1]" />
      </div>

      {isRag && (
        <div className="mt-4 space-y-3 rounded-lg border border-[#66FCF1]/10 bg-[#0B0C10] p-3">
          <div className="rounded-md border border-[#45A29E]/20 bg-[#101820] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#45A29E]">Preloaded source</p>
            <p className="mt-1 text-sm font-medium text-white">Business Basics PDF</p>
            <p className="mt-1 text-xs leading-5 text-[#C5C6C7]/60">No upload is needed. Every player is evaluated against the same document.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-md border border-white/8 bg-[#101820] p-1">
            <button
              type="button"
              onClick={() => {
                setQueryMode("sample");
                if (sampleQueries[0]) setQuery(sampleQueries[0]);
              }}
              className={`rounded px-3 py-2 text-xs font-medium transition ${
                queryMode === "sample" ? "bg-[#66FCF1]/15 text-[#66FCF1]" : "text-[#C5C6C7]/60 hover:text-white"
              }`}
            >
              Sample question
            </button>
            <button
              type="button"
              onClick={() => setQueryMode("custom")}
              className={`rounded px-3 py-2 text-xs font-medium transition ${
                queryMode === "custom" ? "bg-[#66FCF1]/15 text-[#66FCF1]" : "text-[#C5C6C7]/60 hover:text-white"
              }`}
            >
              Ask your own
            </button>
          </div>

          {queryMode === "sample" && sampleQueries.length > 0 ? (
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">Choose a question</span>
              <select
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-xs text-[#C5C6C7] outline-none transition focus:border-[#66FCF1]/50"
              >
                {sampleQueries.map((sampleQuery) => (
                  <option key={sampleQuery} value={sampleQuery}>{sampleQuery}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">Your question</span>
              <input
                value={queryMode === "custom" ? query : ""}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-xs text-[#C5C6C7] outline-none transition focus:border-[#66FCF1]/50"
                placeholder="Ask anything about the Business Basics document"
              />
            </label>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-400/20 bg-red-950/30 px-3 py-2 text-xs leading-5 text-red-100">
          {errorMessage}
        </div>
      )}

      {validationWarning && (
        <div className="mt-4 rounded-lg border border-amber-400/25 bg-amber-950/20 px-3 py-2 text-xs leading-5 text-amber-100">
          <span className="font-semibold">Architecture warning:</span> {validationWarning} The simulation will still run, but these issues will reduce your score.
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[#66FCF1] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] transition hover:bg-[#8ffdf6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {busy ? "Simulating..." : "Run Simulation"}
        </button>
        <button
          type="button"
          onClick={resetGraph}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-md border border-white/10 bg-[#0B0C10] px-3 py-2.5 text-[#C5C6C7] transition hover:border-[#66FCF1]/40 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Reset graph"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {isRag && runState === "completed" && lastResponse && (
        <button
          type="button"
          onClick={() => navigate(`/result/${config.challengeMeta.challengeId}`)}
          className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-[#66FCF1]/30 bg-[#66FCF1]/10 px-4 py-2.5 text-sm font-semibold text-[#66FCF1] transition hover:border-[#66FCF1]/60 hover:bg-[#66FCF1]/15"
        >
          View Scorecard
        </button>
      )}
    </section>
  );
}
