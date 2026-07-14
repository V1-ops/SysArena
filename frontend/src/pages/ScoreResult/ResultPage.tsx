import { ArrowRight, Home, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { challenges } from "../../data/challenges";
import { loadRagRun } from "../../lib/rag-session";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

const fallbackBreakdown = [
  { label: "Architecture", score: 92 },
  { label: "Reliability", score: 95 },
  { label: "Latency", score: 84 },
  { label: "Cost", score: 78 },
];

export function ResultPage() {
  const { challengeId } = useParams();
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];
  const ragRun = challenge.category === "RAG" ? loadRagRun() : null;
  const totalScore = ragRun
    ? ragRun.scoreBreakdown.reduce((sum, item) => sum + item.score, 0)
    : 91;
  const totalMax = ragRun
    ? ragRun.scoreBreakdown.reduce((sum, item) => sum + item.maxScore, 0)
    : 100;
  const breakdownItems = ragRun
    ? ragRun.scoreBreakdown.map((item) => ({
        label: item.label,
        score: item.maxScore ? Math.round((item.score / item.maxScore) * 100) : 0,
      }))
    : fallbackBreakdown;
  const feedback = ragRun
    ? [
        `Positive: ${ragRun.judgeFeedback.positive}`,
        `Weakness: ${ragRun.judgeFeedback.weakness}`,
        `Next step: ${ragRun.judgeFeedback.nextStep}`,
      ]
    : [
        "Strong use of queueing to protect message delivery under load.",
        "Redis could be integrated more explicitly to reduce repeat read latency.",
        "Next step: connect cache closer to the chat service for faster status lookups.",
      ];
  const recommendations = ragRun?.judgeFeedback.recommendations ?? [
    "Add cache",
    "Improve ordering under burst load",
    "Reduce cross-service dependency in hot paths",
  ];

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#66FCF1]/15 bg-[#66FCF1]/8 px-4 py-2 text-sm text-[#66FCF1]">
              <Sparkles className="h-4 w-4" />
              Challenge Complete
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white">
              {totalScore} / {totalMax}
            </h1>
            <p className="text-lg text-[#45A29E]">
              Badge Unlocked: {challenge.category === "RAG" ? "RAG Builder" : "Messaging Architect"}
            </p>
            <p className="max-w-2xl text-base leading-7 text-[#C5C6C7]/65">
              {ragRun?.judgeFeedback.positive ??
                "Strong architecture overall. You balanced delivery reliability and speed well, with a clear service path."}
            </p>
            {ragRun && ragRun.pipelineValid === false && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-950/20 px-4 py-3 text-sm leading-6 text-amber-100">
                This run completed with architecture issues. Review the feedback below and adjust the graph before replaying.
              </div>
            )}
          </div>
          <div className="flex items-center justify-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-full border border-[#66FCF1]/15 bg-[radial-gradient(circle_at_top,rgba(102,252,241,0.18),transparent_40%),#10161d] shadow-[0_0_60px_rgba(102,252,241,0.12)]">
              <Trophy className="h-16 w-16 text-[#66FCF1]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {ragRun && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#45A29E]">Simulation output</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Grounded answer</h2>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#0F151B] p-4 text-sm leading-7 text-[#C5C6C7]/75">
                {ragRun.answer}
              </div>
              <div>
                <p className="text-sm font-medium text-white">Retrieved evidence</p>
                <div className="mt-3 space-y-2">
                  {ragRun.retrievedChunks.slice(0, 3).map((chunk) => (
                    <div key={chunk.chunkId} className="rounded-xl border border-white/5 bg-[#0F151B] p-3">
                      <div className="flex items-center justify-between gap-3 text-xs text-[#66FCF1]">
                        <span>{chunk.chunkId}</span>
                        <span>score {chunk.score.toFixed(3)}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#C5C6C7]/65">{chunk.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#45A29E]">Run telemetry</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">What happened</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Metric label="Latency" value={`${ragRun.metrics.latencyMs} ms`} />
                <Metric label="Retrieved chunks" value={String(ragRun.metrics.retrievedChunkCount)} />
                <Metric label="Top K" value={String(ragRun.metrics.topK)} />
                <Metric label="Chunking" value={`${ragRun.metrics.chunkSize} / ${ragRun.metrics.chunkOverlap}`} />
                <Metric label="Reranker" value={ragRun.metrics.rerankerUsed ? "Used" : "Not used"} />
                <Metric label="Execution" value={ragRun.metrics.estimatedCost} />
                <Metric label="Execution mode" value={ragRun.metrics.executionMode} />
                <Metric label="Embedding model" value={ragRun.metrics.embeddingModel} />
                <Metric label="Generation model" value={ragRun.metrics.generationModel} />
              </div>
              {ragRun.executionDiagnostics?.warnings.length ? (
                <div className="rounded-xl border border-amber-400/20 bg-amber-950/20 px-4 py-3 text-xs leading-5 text-amber-100">
                  {ragRun.executionDiagnostics.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-2xl font-semibold text-white">Breakdown</h2>
            {breakdownItems.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#C5C6C7]/70">{item.label}</span>
                  <span className="text-sm font-medium text-white">{item.score}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#10161d]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#45A29E_0%,#66FCF1_100%)]"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">AI Judge Feedback</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[#C5C6C7]/70">
                {feedback.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0F151B] p-4">
              <p className="text-sm font-medium text-white">Recommendations</p>
              <ul className="mt-3 space-y-2 text-sm text-[#C5C6C7]/65">
                {recommendations.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={`/build/${challenge.id}`}>
                  <RotateCcw className="h-4 w-4" />
                  Replay
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/challenges">
                  <ArrowRight className="h-4 w-4" />
                  Next Challenge
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Back Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0F151B] px-4 py-3">
      <p className="text-xs text-[#C5C6C7]/55">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
