import { CheckCircle2, Clock3, Database, Sparkles, Zap } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { challenges } from "../../data/challenges";
import { Button } from "../../components/ui/button";
import { loadRagRun } from "../../lib/rag-session";

export function SimulationPage() {
  const { challengeId } = useParams();
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];
  const run = loadRagRun();

  if (!run) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="rounded-3xl border border-white/6 bg-[#0D141A] p-8 text-center">
          <p className="text-xl font-semibold text-white">No simulation data found</p>
          <p className="mt-3 text-sm text-[#C5C6C7]/65">
            Run the RAG challenge from the builder to generate a simulation.
          </p>
          <Button asChild className="mt-5">
            <Link to={`/build/${challenge.id}`}>Back to Builder</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#091014] px-5 py-6 md:px-8 xl:px-12">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[#45A29E]">Simulation</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{challenge.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#C5C6C7]/75">
          <div className="rounded-2xl border border-white/6 bg-white/5 px-4 py-2.5">
            Run Status: {run.status}
          </div>
          <div className="rounded-2xl border border-white/6 bg-white/5 px-4 py-2.5">
            Elapsed: {run.metrics.latencyMs}ms
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/6 bg-[#0D141A] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            <div className="rounded-[24px] border border-white/6 bg-[#0A1015] p-4">
              <p className="mb-4 text-sm font-medium text-[#C5C6C7]/70">Mini Preview</p>
              <div className="rounded-[22px] border border-[#66FCF1]/10 bg-[#111A22] p-4">
                <div className="space-y-4">
                  <div className="max-w-[88%] rounded-2xl bg-[#1F2833] px-4 py-3 text-sm text-[#C5C6C7]">
                    {String(
                      run.simulationTimeline.find((event) => event.type === "receive_query")?.meta?.query ?? ""
                    )}
                  </div>
                  <div className="ml-auto max-w-[90%] rounded-2xl bg-[#66FCF1] px-4 py-3 text-sm font-medium text-[#0B0C10]">
                    {run.answer}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-[440px] overflow-hidden rounded-[24px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(102,252,241,0.12),transparent_28%),#0B1015]">
              <SimNode label="PDF Loader" left="8%" top="18%" />
              <SimNode label="Chunking" left="30%" top="18%" active />
              <SimNode label="Embeddings" left="53%" top="18%" active />
              <SimNode label="Vector DB" left="74%" top="18%" />
              <SimNode label="Retriever" left="28%" top="58%" active />
              <SimNode label="LLM" left="58%" top="58%" active />

              <SimPath left="18%" top="25%" width="13%" />
              <SimPath left="41%" top="25%" width="13%" />
              <SimPath left="64%" top="25%" width="12%" />
              <SimPath left="61%" top="44%" width="2px" height="14%" vertical />
              <SimPath left="37%" top="65%" width="21%" />

              <div className="absolute left-[38%] top-[65%] h-4 w-4 rounded-full bg-[#66FCF1] shadow-[0_0_30px_rgba(102,252,241,0.85)]" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard icon={Zap} label="Latency" value={`${run.metrics.latencyMs}ms`} />
            <MetricCard icon={Clock3} label="Top K" value={`${run.metrics.topK}`} />
            <MetricCard icon={Database} label="Context Size" value={`${run.metrics.contextChars} chars`} />
          </div>

          <div className="rounded-[24px] border border-white/6 bg-[#0D141A] p-6">
            <p className="mb-4 text-lg font-semibold text-white">Status Feed</p>
            <div className="space-y-3">
              {run.simulationTimeline.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#66FCF1]" />
                  <div className="text-sm text-[#C5C6C7]/75">
                    <p>{item.label}</p>
                    <p className="text-xs text-[#C5C6C7]/45">
                      {item.durationMs}ms
                      {item.meta?.retrievedChunkCount ? ` • ${item.meta.retrievedChunkCount} chunks` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/6 bg-[#0D141A] p-6">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-[#66FCF1]" />
              Retrieved Chunks
            </div>
            <div className="space-y-3">
              {run.retrievedChunks.map((chunk) => (
                <div key={chunk.chunkId} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{chunk.chunkId}</span>
                    <span className="text-xs text-[#45A29E]">score {chunk.score}</span>
                  </div>
                  <p className="text-sm leading-6 text-[#C5C6C7]/65">{chunk.text}</p>
                </div>
              ))}
            </div>
          </div>

          <Button asChild size="lg" className="w-full">
            <Link to={`/result/${challenge.id}`}>Continue to Score</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SimNode({
  label,
  left,
  top,
  active,
}: {
  label: string;
  left: string;
  top: string;
  active?: boolean;
}) {
  return (
    <div
      className={`absolute rounded-2xl border px-4 py-3 text-sm font-medium ${
        active
          ? "border-[#66FCF1]/30 bg-[#112028] text-white shadow-[0_0_30px_rgba(102,252,241,0.15)]"
          : "border-white/6 bg-[#11161d] text-[#C5C6C7]"
      }`}
      style={{ left, top }}
    >
      {label}
    </div>
  );
}

function SimPath({
  left,
  top,
  width,
  height,
  vertical,
}: {
  left: string;
  top: string;
  width: string;
  height?: string;
  vertical?: boolean;
}) {
  return (
    <div
      className="absolute rounded-full bg-[#66FCF1] shadow-[0_0_18px_rgba(102,252,241,0.5)]"
      style={vertical ? { left, top, width, height } : { left, top, width, height: "2px" }}
    />
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-[#0D141A] p-5">
      <Icon className="h-5 w-5 text-[#66FCF1]" />
      <p className="mt-4 text-sm text-[#C5C6C7]/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
