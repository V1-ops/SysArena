import { AlertTriangle, Check, CheckCircle2, Clipboard, Database, FileUp, Loader2, Play, RotateCcw, Table2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGraphStore } from "../hooks/useGraphStore";
import { useSimulationTrace } from "../hooks/useSimulationTrace";
import { fetchAgentDatasets, runAgentChallenge, validateAgentBuild } from "../../../services/api";
import type { AgentDataset, AgentRunResponse, BuildEdge, BuildNode } from "../../../types";
import type { SimulationTraceStep, SubmitPipelineResponse } from "../types/graph.types";

const AGENT_ORDER = [
  { type: "planner", label: "Planner", subtitle: "Intent" },
  { type: "researcher", label: "Researcher", subtitle: "Schema" },
  { type: "coder", label: "Coder", subtitle: "SQL draft" },
  { type: "tester", label: "Tester", subtitle: "Verify" },
  { type: "reviewer", label: "Reviewer", subtitle: "Deliver" },
];

function toBuildNodes(nodes: ReturnType<typeof useGraphStore.getState>["nodes"], registry: ReturnType<typeof useGraphStore.getState>["config"]["nodeRegistry"]): BuildNode[] {
  return nodes.flatMap((node) => {
    const definition = registry.find((item) => item.id === node.data.nodeTypeId);
    return definition ? [{ id: node.id, type: node.data.nodeTypeId, label: definition.label }] : [];
  });
}

function toBuildEdges(edges: ReturnType<typeof useGraphStore.getState>["edges"]): BuildEdge[] {
  return edges.map((edge) => ({ source: edge.source, target: edge.target }));
}

function toOverlayResponse(run: AgentRunResponse, trace: SimulationTraceStep[]): SubmitPipelineResponse {
  const points = run.scoreBreakdown.reduce((sum, item) => sum + item.score, 0);
  const maximum = run.scoreBreakdown.reduce((sum, item) => sum + item.maxScore, 0) || 100;
  return {
    submissionId: run.runId,
    status: "completed",
    score: {
      overall: points / maximum,
      metrics: Object.fromEntries(run.scoreBreakdown.map((item) => [item.label, item.maxScore ? item.score / item.maxScore : 0])),
    },
    trace,
    leaderboardRank: Math.max(1, Math.round((maximum - points) / 5) + 1),
    agentResult: run,
  };
}

function customDataset(fileName: string, text: string): AgentDataset {
  const [header = ""] = text.trim().split(/\r?\n/);
  const columns = header.split(",").map((name) => ({ name: name.trim(), type: "AUTO" })).filter((column) => column.name);
  return {
    id: "custom",
    name: fileName || "Custom Upload",
    description: "User-provided CSV dataset.",
    rowCount: Math.max(0, text.trim().split(/\r?\n/).length - 1),
    sampleQueries: [],
    columns,
  };
}

type AgentArtifactKey = "planArtifact" | "researchArtifact" | "sqlArtifact" | "verificationArtifact" | "reviewArtifact";

function artifactText(result: AgentRunResponse | undefined, type: AgentArtifactKey, fallback: string) {
  const artifact = result?.[type];
  if (!artifact) return fallback;
  return typeof artifact.summary === "string" ? artifact.summary : fallback;
}

export function AgentControlRoom() {
  const config = useGraphStore((state) => state.config);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const runState = useGraphStore((state) => state.runState);
  const lastResponse = useGraphStore((state) => state.lastResponse);
  const errorMessage = useGraphStore((state) => state.errorMessage);
  const setRunState = useGraphStore((state) => state.setRunState);
  const setLastResponse = useGraphStore((state) => state.setLastResponse);
  const setErrorMessage = useGraphStore((state) => state.setErrorMessage);
  const clearEventLog = useGraphStore((state) => state.clearEventLog);
  const resetNodeStatuses = useGraphStore((state) => state.resetNodeStatuses);
  const runSimulationTrace = useSimulationTrace();

  const [datasets, setDatasets] = useState<AgentDataset[]>([]);
  const [selectedId, setSelectedId] = useState("retail-sales");
  const [activeDataset, setActiveDataset] = useState<AgentDataset | null>(null);
  const [customCsv, setCustomCsv] = useState("");
  const [query, setQuery] = useState("");
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [copyState, setCopyState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchAgentDatasets()
      .then((items) => {
        if (cancelled) return;
        setDatasets(items);
        const initial = items.find((item) => item.id === "retail-sales") ?? items[0];
        setActiveDataset(initial ?? null);
        setQuery(initial?.sampleQueries[0] ?? "");
      })
      .catch((error) => {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : "Unable to load datasets.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDatasets(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setErrorMessage]);

  const result = lastResponse?.agentResult;
  const busy = runState === "submitting" || runState === "running";
  const selectedColumns = useMemo(() => activeDataset?.columns ?? [], [activeDataset]);

  function selectDataset(datasetId: string) {
    const selected = datasets.find((item) => item.id === datasetId);
    if (!selected) return;
    setSelectedId(datasetId);
    setActiveDataset(selected);
    setCustomCsv("");
    setQuery(selected.sampleQueries[0] ?? "");
    setLastResponse(null);
    setErrorMessage(null);
    clearEventLog();
    resetNodeStatuses();
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setCustomCsv(text);
    setSelectedId("custom");
    setActiveDataset(customDataset(file.name, text));
    setQuery("");
    setLastResponse(null);
    setErrorMessage(null);
    clearEventLog();
    resetNodeStatuses();
  }

  async function handleRun() {
    try {
      if (!query.trim()) {
        setErrorMessage("Enter an analytics question before running the workflow.");
        return;
      }
      setRunState("submitting");
      setErrorMessage(null);
      clearEventLog();
      const buildNodes = toBuildNodes(nodes, config.nodeRegistry);
      const buildEdges = toBuildEdges(edges);
      const validation = await validateAgentBuild(config.challengeMeta.challengeId, buildNodes, buildEdges);
      if (!validation.isValid) {
        setRunState("error");
        setErrorMessage(validation.feedback.join(" "));
        return;
      }
      const run = await runAgentChallenge(config.challengeMeta.challengeId, buildNodes, buildEdges, {
        datasetId: selectedId === "custom" ? undefined : selectedId,
        documentName: selectedId === "custom" ? activeDataset?.name : undefined,
        documentText: selectedId === "custom" ? customCsv : undefined,
        query,
      });
      const nodeIds = new Map(buildNodes.map((node) => [node.label, node.id]));
      const trace = run.simulationTimeline.flatMap((event): SimulationTraceStep[] => {
        const nodeId = nodeIds.get(event.label);
        if (!nodeId) return [];
        return [{
          nodeId,
          status: event.status === "completed" ? "success" : "error",
          timestampMs: event.startedAtOffsetMs,
          durationMs: event.durationMs,
          activeMessage: `${event.label} is processing the dataset.`,
          completedMessage: event.meta?.retry ? "SQL repaired and re-verified." : `${event.label} completed.`,
        }];
      });
      setLastResponse(toOverlayResponse(run, trace));
      setActiveDataset(run.dataset);
      await runSimulationTrace(trace);
    } catch (error) {
      setRunState("error");
      setErrorMessage(error instanceof Error ? error.message : "Agent workflow failed.");
    }
  }

  async function copySql() {
    if (!result?.sql) return;
    await navigator.clipboard.writeText(result.sql);
    setCopyState(true);
    window.setTimeout(() => setCopyState(false), 1400);
  }

  return (
    <section className="space-y-4 rounded-lg border border-[#66FCF1]/15 bg-[#0D151B] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#45A29E]">Agent Control Room</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Text-to-SQL Studio</h2>
          <p className="mt-1 text-xs leading-5 text-[#C5C6C7]/60">Select data, ask a question, and inspect every verified artifact.</p>
        </div>
        <Database className="mt-1 h-5 w-5 text-[#66FCF1]" />
      </div>

      <div className="rounded-lg border border-white/8 bg-[#101820] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#45A29E]">Dataset</p>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-[#0B0C10] px-2.5 py-1.5 text-[11px] text-[#C5C6C7]/75 hover:border-[#66FCF1]/40">
            <FileUp className="h-3.5 w-3.5" /> Upload CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void handleFileChange(event.target.files?.[0])} />
          </label>
        </div>
        <select
          value={selectedId}
          disabled={loadingDatasets || busy}
          onChange={(event) => selectDataset(event.target.value)}
          className="mt-3 w-full rounded-md border border-white/10 bg-[#0B0C10] px-3 py-2 text-sm text-white outline-none focus:border-[#66FCF1]/50"
        >
          {datasets.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}
          {selectedId === "custom" && <option value="custom">{activeDataset?.name ?? "Custom Upload"}</option>}
        </select>
        {activeDataset && (
          <>
            <p className="mt-2 text-xs leading-5 text-[#C5C6C7]/60">{activeDataset.description}</p>
            <div className="mt-3 flex gap-2 text-[10px] uppercase tracking-[0.12em] text-[#C5C6C7]/50">
              <span className="rounded-md border border-white/8 px-2 py-1">{activeDataset.rowCount} rows</span>
              <span className="rounded-md border border-white/8 px-2 py-1">{selectedColumns.length} columns</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedColumns.map((column) => <span key={column.name} className="rounded-md bg-[#66FCF1]/8 px-2 py-1 text-[10px] text-[#C5C6C7]/75">{column.name} <span className="text-[#45A29E]">{column.type}</span></span>)}
            </div>
          </>
        )}
      </div>

      <div className="rounded-lg border border-white/8 bg-[#101820] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#45A29E]">Ask the analyst team</p>
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Example: What is the average rating by genre?"
          className="mt-3 min-h-20 w-full resize-y rounded-md border border-white/10 bg-[#0B0C10] px-3 py-2 text-xs leading-5 text-[#C5C6C7] outline-none focus:border-[#66FCF1]/50"
        />
        {!!activeDataset?.sampleQueries.length && (
          <div className="mt-3 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#C5C6C7]/45">Try an example</p>
            <div className="flex flex-wrap gap-1.5">
              {activeDataset.sampleQueries.map((sample) => <button key={sample} type="button" onClick={() => setQuery(sample)} className="rounded-md border border-white/8 px-2 py-1.5 text-left text-[10px] leading-4 text-[#C5C6C7]/70 hover:border-[#66FCF1]/35 hover:text-white">{sample}</button>)}
            </div>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => void handleRun()} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-[#66FCF1] px-3 py-2.5 text-sm font-semibold text-[#0B0C10] hover:bg-[#8ffdf6] disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {busy ? "Running workflow" : "Run Text-to-SQL"}
          </button>
          <button type="button" onClick={() => { setQuery(activeDataset?.sampleQueries[0] ?? ""); setLastResponse(null); setErrorMessage(null); }} disabled={busy} className="inline-flex items-center justify-center rounded-md border border-white/10 bg-[#0B0C10] px-3 py-2.5 text-[#C5C6C7] hover:border-[#66FCF1]/40" aria-label="Reset query">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {errorMessage && <div className="flex gap-2 rounded-lg border border-red-400/20 bg-red-950/30 p-3 text-xs leading-5 text-red-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{errorMessage}</div>}

      <div className="rounded-lg border border-white/8 bg-[#101820] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#45A29E]">Agent artifacts</p>
          <span className="text-[10px] uppercase tracking-[0.12em] text-[#C5C6C7]/45">{runState}</span>
        </div>
        <div className="mt-3 space-y-2">
          {AGENT_ORDER.map((agent) => {
            const node = nodes.find((item) => item.data.nodeTypeId === agent.type);
            const status = node?.data.status ?? "idle";
            const artifactKey: AgentArtifactKey = agent.type === "planner"
              ? "planArtifact"
              : agent.type === "researcher"
                ? "researchArtifact"
                : agent.type === "coder"
                  ? "sqlArtifact"
                  : agent.type === "tester"
                    ? "verificationArtifact"
                    : "reviewArtifact";
            const fallback = status === "idle" ? "Waiting for the workflow." : status === "running" ? "Working on the current artifact…" : "Completed.";
            return (
              <div key={agent.type} className="rounded-md border border-white/8 bg-[#0B0C10] p-2.5">
                <div className="flex items-center gap-2">
                  {status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#66FCF1]" />}
                  {status === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-[#66FCF1]" />}
                  {status === "error" && <AlertTriangle className="h-3.5 w-3.5 text-red-300" />}
                  {status === "idle" && <span className="h-3.5 w-3.5 rounded-full border border-white/20" />}
                  <span className="text-xs font-semibold text-white">{agent.label}</span>
                  <span className="text-[10px] text-[#45A29E]">{agent.subtitle}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-[#C5C6C7]/60">{artifactText(result, artifactKey, fallback)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {result && (
        <>
          <div className="rounded-lg border border-[#66FCF1]/20 bg-[#101820] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[#66FCF1]" /><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#45A29E]">Verified SQL</p></div>
              <button type="button" onClick={() => void copySql()} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-[10px] text-[#C5C6C7]/75 hover:border-[#66FCF1]/40">{copyState ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}{copyState ? "Copied" : "Copy"}</button>
            </div>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-white/8 bg-[#0B0C10] p-3 text-[11px] leading-5 text-[#C5C6C7]/85">{result.sql}</pre>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-[#C5C6C7]/50"><span>{result.dataset.name}</span><span>• {result.metrics.latencyMs}ms</span><span>• {result.metrics.retryCount} retries</span></div>
          </div>

          <div className="rounded-lg border border-white/8 bg-[#101820] p-3">
            <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Table2 className="h-4 w-4 text-[#66FCF1]" /><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#45A29E]">Result preview</p></div><span className="text-[10px] text-[#C5C6C7]/45">{result.metrics.rowCount} rows</span></div>
            {result.result.rows.length ? (
              <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[300px] text-left text-[11px]"><thead className="text-[#C5C6C7]/45"><tr>{result.result.columns.map((column) => <th key={column} className="px-2 py-1.5 font-medium">{column}</th>)}</tr></thead><tbody>{result.result.rows.slice(0, 6).map((row, index) => <tr key={index} className="border-t border-white/6 text-[#C5C6C7]/75">{result.result.columns.map((column) => <td key={column} className="px-2 py-1.5">{String(row[column] ?? "—")}</td>)}</tr>)}</tbody></table></div>
            ) : <p className="mt-3 text-xs text-[#C5C6C7]/55">The verified query returned no rows.</p>}
          </div>
        </>
      )}
    </section>
  );
}
