<<<<<<< Updated upstream
import { useParams } from "react-router-dom";
import { CanvasSimulationExperience } from "../../features/pipeline-canvas/CanvasSimulationExperience";
import type { GameModeId } from "../../features/pipeline-canvas/config";
import { challenges } from "../../data/challenges";

function modeForChallenge(challengeId?: string): GameModeId {
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];

  if (challenge.category === "RAG" || challenge.category === "Debug") {
    return "rag-builder";
  }

  if (challenge.category === "Agents") {
    return "agent-builder";
  }

  return "system-design-builder";
}
=======
import {
  ArrowDown,
  ArrowUp,
  Clock3,
  Loader2,
  Play,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { challenges } from "../../data/challenges";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { fetchChallengeDetail, runRagChallenge, validateBuild } from "../../services/api";
import { loadRagBuild, saveRagBuild, saveRagRun } from "../../lib/rag-session";
import { BuildEdge, BuildNode, ChallengeDetail, ValidateBuildResponse } from "../../types";
>>>>>>> Stashed changes

export function BuilderPage() {
  const navigate = useNavigate();
  const { challengeId } = useParams();
<<<<<<< Updated upstream

  return <CanvasSimulationExperience initialModeId={modeForChallenge(challengeId)} />;
=======
  const fallbackChallenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [pipeline, setPipeline] = useState<BuildNode[]>([]);
  const [selectedQuery, setSelectedQuery] = useState("");
  const [validation, setValidation] = useState<ValidateBuildResponse | null>(null);
  const [loading, setLoading] = useState(fallbackChallenge.category === "RAG");
  const [validating, setValidating] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!challengeId || fallbackChallenge.category !== "RAG") return;
    const saved = loadRagBuild<{ pipeline: BuildNode[]; selectedQuery: string }>();
    if (saved) {
      setPipeline(saved.pipeline ?? []);
      setSelectedQuery(saved.selectedQuery ?? "");
    }

    setLoading(true);
    fetchChallengeDetail(challengeId)
      .then((data) => {
        setChallenge(data);
        setSelectedQuery((current) => current || data.sampleQueries[0] || "");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [challengeId, fallbackChallenge.category]);

  const resolvedChallenge =
    challenge ??
    ({
      ...fallbackChallenge,
      sampleQueries: [],
      scoringDimensions: [],
      validationRules: {
        requiredCore: [],
        optionalComponents: [],
        singlePipeline: true,
      },
    } satisfies ChallengeDetail);

  const edges: BuildEdge[] = useMemo(
    () =>
      pipeline.slice(0, -1).map((node, index) => ({
        source: node.id,
        target: pipeline[index + 1].id,
      })),
    [pipeline]
  );

  useEffect(() => {
    if (pipeline.length === 0 || !challengeId || resolvedChallenge.category !== "RAG") {
      setValidation(null);
      return;
    }

    saveRagBuild({ pipeline, selectedQuery });
    setValidating(true);
    validateBuild(challengeId, pipeline, edges)
      .then((data) => {
        setValidation(data);
        setError(null);
      })
      .catch((err: Error) => {
        setValidation(null);
        setError(err.message);
      })
      .finally(() => setValidating(false));
  }, [challengeId, edges, pipeline, resolvedChallenge.category, selectedQuery]);

  const addNode = (label: string) => {
    const node: BuildNode = {
      id: `${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "component",
      label,
    };
    setPipeline((current) => [...current, node]);
  };

  const removeNode = (id: string) => {
    setPipeline((current) => current.filter((node) => node.id !== id));
  };

  const moveNode = (index: number, direction: -1 | 1) => {
    setPipeline((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const clone = [...current];
      [clone[index], clone[nextIndex]] = [clone[nextIndex], clone[index]];
      return clone;
    });
  };

  const handleRun = async () => {
    if (!challengeId || !validation?.isValid || !selectedQuery) return;
    setRunning(true);
    try {
      const run = await runRagChallenge(challengeId, pipeline, edges, selectedQuery);
      saveRagRun(run);
      saveRagBuild({ pipeline, selectedQuery });
      navigate(`/simulate/${challengeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to run simulation.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#45A29E]">
              {resolvedChallenge.category}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{resolvedChallenge.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#C5C6C7]/65">
              <span>{resolvedChallenge.difficulty}</span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#45A29E]" />
                {resolvedChallenge.estimatedTime}
              </span>
              <span>Draft Saved</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#66FCF1]/10 bg-[#0F151B] px-4 py-3 text-sm text-[#C5C6C7]/70">
            Goal: Build a valid business RAG pipeline that can answer user questions from the PDF.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr_320px]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Node Palette</h2>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-[#66FCF1]" />}
            </div>
            {resolvedChallenge.supportedComponents.map((item) => (
              <button
                key={item}
                onClick={() => addNode(item)}
                className="w-full rounded-2xl border border-white/5 bg-[#0F151B] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#66FCF1]/15"
              >
                <p className="font-medium text-white">{item}</p>
                <p className="mt-1 text-sm text-[#C5C6C7]/60">
                  Click to add this component to the pipeline.
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative min-h-[620px] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(102,252,241,0.08),transparent_32%)]" />
              <div className="relative z-10 flex min-h-[620px] flex-col items-center justify-center gap-5 px-6 py-8">
                {pipeline.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#66FCF1]/15 bg-[#0F151B]/70 px-8 py-10 text-center">
                    <p className="text-lg font-medium text-white">Your RAG canvas is empty</p>
                    <p className="mt-2 text-sm text-[#C5C6C7]/60">
                      Add components from the left to build the pipeline.
                    </p>
                  </div>
                ) : (
                  pipeline.map((node, index) => (
                    <div key={node.id} className="flex flex-col items-center gap-3">
                      <GraphNode label={node.label} active={validation?.normalizedPipeline.includes(node.label)} />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveNode(index, -1)}
                          className="rounded-xl border border-white/6 bg-[#10161d] p-2 text-[#C5C6C7]/70 hover:text-white disabled:opacity-40"
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveNode(index, 1)}
                          className="rounded-xl border border-white/6 bg-[#10161d] p-2 text-[#C5C6C7]/70 hover:text-white disabled:opacity-40"
                          disabled={index === pipeline.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeNode(node.id)}
                          className="rounded-xl border border-red-400/10 bg-red-500/5 p-2 text-red-200 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {index < pipeline.length - 1 && <GraphEdge active={validation?.isValid} />}
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Properties & Guidance</h2>
              <p className="mt-2 text-sm leading-6 text-[#C5C6C7]/65">
                Build a single connected pipeline. Validation and scoring update automatically.
              </p>
            </div>

            <div className="rounded-2xl border border-[#66FCF1]/10 bg-[#0F151B] p-4">
              <p className="text-sm font-medium text-white">Ask a Query</p>
              <textarea
                value={selectedQuery}
                onChange={(event) => setSelectedQuery(event.target.value)}
                rows={4}
                placeholder="Ask a business basics question..."
                className="mt-3 w-full resize-none rounded-2xl border border-white/6 bg-[#11161d] px-4 py-3 text-sm text-[#C5C6C7] outline-none"
              />
              {resolvedChallenge.sampleQueries.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {resolvedChallenge.sampleQueries.map((query) => (
                    <button
                      key={query}
                      onClick={() => setSelectedQuery(query)}
                      className="rounded-full border border-white/6 bg-white/5 px-3 py-1.5 text-xs text-[#C5C6C7]/75 transition-colors hover:border-[#66FCF1]/20 hover:text-white"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0F151B] p-4">
              <p className="text-sm font-medium text-white">Hint</p>
              <p className="mt-2 text-sm leading-6 text-[#C5C6C7]/65">{resolvedChallenge.hint}</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0F151B] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">Validation</p>
                {validating && <Loader2 className="h-4 w-4 animate-spin text-[#66FCF1]" />}
              </div>
              {validation ? (
                <div className="mt-3 space-y-2 text-sm text-[#C5C6C7]/70">
                  <p className={validation.isValid ? "text-[#66FCF1]" : "text-yellow-200"}>
                    {validation.isValid ? "Pipeline ready to run." : "Pipeline needs fixes before it can run."}
                  </p>
                  <p>Score Preview: {validation.scorePreview}/100</p>
                  {validation.feedback.map((item) => (
                    <p key={item}>- {item}</p>
                  ))}
                  {validation.invalidEdges.map((edge) => (
                    <p key={`${edge.source}-${edge.target}`} className="text-red-200">
                      - {edge.reason}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#C5C6C7]/60">Add components to start validation.</p>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Button size="lg" disabled={!validation?.isValid || !selectedQuery || running} onClick={handleRun}>
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Simulation
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setPipeline([])}>
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
              <Button variant="ghost">
                <Sparkles className="h-4 w-4" />
                Hint
              </Button>
              <Button variant="ghost" onClick={() => saveRagBuild({ pipeline, selectedQuery })}>
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GraphNode({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-6 py-4 text-sm font-medium shadow-[0_18px_40px_rgba(0,0,0,0.35)] ${
        active
          ? "border-[#66FCF1]/30 bg-[#112028] text-white shadow-[0_0_30px_rgba(102,252,241,0.15)]"
          : "border-white/6 bg-[#11161d] text-[#C5C6C7]"
      }`}
    >
      {label}
    </div>
  );
}

function GraphEdge({ active }: { active?: boolean }) {
  return (
    <div
      className={`h-10 w-[2px] rounded-full ${
        active ? "bg-[#66FCF1] shadow-[0_0_18px_rgba(102,252,241,0.6)]" : "bg-[#45A29E]/50"
      }`}
    />
  );
>>>>>>> Stashed changes
}
