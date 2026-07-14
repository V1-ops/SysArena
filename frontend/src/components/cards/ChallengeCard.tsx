import { ArrowUpRight, BrainCircuit, Bug, Database, Gauge, Network, Play } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { Challenge } from "../../types";
import { Card, CardContent } from "../ui/card";
import { ChallengeMetadata } from "../challenges/ChallengeMetadata";
import { ChallengeStatusBadge } from "../challenges/ChallengeStatusBadge";
import { WorkflowStrip } from "../challenges/WorkflowStrip";
import { getChallengeStartPath, isChallengeActive } from "../../lib/challenge-routing";

const categoryIcons = {
  RAG: Database,
  Agents: BrainCircuit,
  "System Design": Network,
  Debug: Bug,
  Optimize: Gauge,
} as const;

export function ChallengeCard({ challenge, onPreview }: { challenge: Challenge; onPreview?: (challenge: Challenge) => void }) {
  const location = useLocation();
  const Icon = categoryIcons[challenge.category as keyof typeof categoryIcons] ?? BrainCircuit;
  const active = isChallengeActive(challenge.id, location.pathname);
  const startPath = getChallengeStartPath(challenge);

  return (
    <Card className="group transition-all duration-300 hover:-translate-y-1 hover:border-[#66FCF1]/25 hover:shadow-[0_26px_65px_rgba(0,0,0,0.34)]">
      <CardContent className="flex h-full flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#66FCF1]/15 bg-[#0F1B22] text-[#66FCF1]"><Icon className="h-5 w-5" /></div>
            <div><p className="text-[10px] uppercase tracking-[0.16em] text-[#45A29E]">Stage {String(challenge.stage).padStart(2, "0")}</p><p className="mt-1 text-xs text-[#C5C6C7]/55">{challenge.category}</p></div>
          </div>
          <ChallengeStatusBadge status={active ? "in-progress" : challenge.status} />
        </div>

        <div>
          <h3 className="text-xl font-semibold leading-tight text-white">{challenge.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#C5C6C7]/62">{challenge.outcome}</p>
        </div>

        <div className="rounded-xl border border-white/8 bg-[#0B0C10]/70 p-3"><p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#C5C6C7]/40">Workflow preview</p><WorkflowStrip steps={challenge.workflow} compact /></div>
        <div className="flex flex-wrap gap-1.5">{challenge.tags.map((tag) => <span key={tag} className="rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-[#C5C6C7]/55">{tag}</span>)}</div>
        <div className="mt-auto space-y-4">
          <ChallengeMetadata difficulty={challenge.difficulty} estimatedTime={challenge.estimatedTime} rewardXp={challenge.rewardXp} />
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={startPath}
              className="inline-flex items-center gap-2 rounded-lg bg-[#66FCF1] px-3.5 py-2.5 text-sm font-semibold text-[#0B0C10] transition hover:bg-[#8ffdf6]"
            >
              <Play className="h-3.5 w-3.5" />
              {active ? "Continue" : "Start"}
            </Link>
            <button
              type="button"
              onClick={() => onPreview?.(challenge)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3.5 py-2.5 text-sm font-medium text-[#66FCF1] transition hover:border-[#66FCF1]/35 hover:text-white"
            >
              Preview
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
