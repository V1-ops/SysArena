import { useEffect, useRef } from "react";
import { ArrowRight, BrainCircuit, Bug, Database, Gauge, Network, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { Challenge } from "../../types";
import { ChallengeMetadata } from "./ChallengeMetadata";
import { ChallengeStatusBadge } from "./ChallengeStatusBadge";
import { WorkflowStrip } from "./WorkflowStrip";

const categoryIcons = { RAG: Database, Agents: BrainCircuit, "System Design": Network, Debug: Bug, Optimize: Gauge } as const;

export function ChallengePreviewDrawer({ challenge, onClose }: { challenge: Challenge | null; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!challenge) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [challenge, onClose]);

  if (!challenge) return null;
  const Icon = categoryIcons[challenge.category as keyof typeof categoryIcons] ?? BrainCircuit;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button type="button" aria-label="Close challenge preview" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-[#020608]/75 backdrop-blur-sm" />
      <aside role="dialog" aria-modal="true" aria-labelledby="challenge-preview-title" className="absolute right-0 top-0 h-full w-full max-w-[480px] overflow-y-auto border-l border-white/10 bg-[#0C141A] p-5 shadow-[-30px_0_90px_rgba(0,0,0,0.45)] sm:p-7">
        <div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-[0.2em] text-[#45A29E]">Mission preview</p><button ref={closeButtonRef} type="button" onClick={onClose} className="rounded-lg border border-white/10 p-2 text-[#C5C6C7]/65 transition hover:border-[#66FCF1]/35 hover:text-white" aria-label="Close challenge preview"><X className="h-4 w-4" /></button></div>
        <div className="mt-8 flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#66FCF1]/20 bg-[#101F27] text-[#66FCF1]"><Icon className="h-6 w-6" /></div><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">Stage {String(challenge.stage).padStart(2, "0")}</span><ChallengeStatusBadge status={challenge.status} /></div><h2 id="challenge-preview-title" className="mt-2 text-2xl font-semibold leading-tight text-white">{challenge.title}</h2></div></div>
        <p className="mt-5 text-sm leading-6 text-[#C5C6C7]/68">{challenge.summary}</p>
        <div className="mt-5"><ChallengeMetadata difficulty={challenge.difficulty} estimatedTime={challenge.estimatedTime} rewardXp={challenge.rewardXp} /></div>
        <div className="mt-7 rounded-2xl border border-white/8 bg-[#101820] p-4"><p className="mb-3 text-xs uppercase tracking-[0.16em] text-[#45A29E]">Workflow preview</p><WorkflowStrip steps={challenge.workflow} /></div>
        <div className="mt-6"><p className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">What you&apos;ll learn</p><p className="mt-2 text-sm leading-6 text-white">{challenge.outcome}</p></div>
        <div className="mt-6"><p className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">Mission objectives</p><ul className="mt-3 space-y-2">{challenge.objectives.map((objective) => <li key={objective} className="flex gap-2 rounded-xl border border-white/8 bg-[#101820] px-3 py-2.5 text-xs leading-5 text-[#C5C6C7]/70"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#66FCF1]" />{objective}</li>)}</ul></div>
        <div className="mt-6"><p className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">Components you&apos;ll use</p><div className="mt-3 flex flex-wrap gap-2">{challenge.supportedComponents.map((component) => <span key={component} className="rounded-md border border-white/8 bg-[#101820] px-2.5 py-1.5 text-[11px] text-[#C5C6C7]/70">{component}</span>)}</div></div>
        <div className="mt-8 flex flex-col gap-3"><Link to={`/challenge/${challenge.id}`} onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#66FCF1] px-4 py-3 text-sm font-semibold text-[#0B0C10] transition hover:bg-[#8ffdf6]">Open challenge description <ArrowRight className="h-4 w-4" /></Link><button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-3 text-sm text-[#C5C6C7]/75 transition hover:border-[#66FCF1]/35 hover:text-white">Keep browsing</button></div>
      </aside>
    </div>
  );
}
