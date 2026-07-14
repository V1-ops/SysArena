import { useEffect, useRef, useState } from "react";
import { ArrowRight, BrainCircuit, Bug, Database, Gauge, Network, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { Challenge } from "../../types";
import { getChallengeStartPath, isChallengeActive } from "../../lib/challenge-routing";
import { ChallengeMetadata } from "./ChallengeMetadata";
import { ChallengeStatusBadge } from "./ChallengeStatusBadge";
import { WorkflowStrip } from "./WorkflowStrip";

const categoryIcons = { RAG: Database, Agents: BrainCircuit, "System Design": Network, Debug: Bug, Optimize: Gauge } as const;
const DRAWER_TRANSITION_MS = 300;

export function ChallengePreviewDrawer({ challenge, onClose }: { challenge: Challenge | null; onClose: () => void }) {
  const location = useLocation();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [renderedChallenge, setRenderedChallenge] = useState<Challenge | null>(challenge);
  const [isOpen, setIsOpen] = useState(Boolean(challenge));

  useEffect(() => {
    let closeTimer: number | undefined;
    let animationFrame: number | undefined;

    if (challenge) {
      setRenderedChallenge(challenge);
      setIsOpen(false);
      animationFrame = window.requestAnimationFrame(() => setIsOpen(true));
    } else if (renderedChallenge) {
      setIsOpen(false);
      closeTimer = window.setTimeout(() => setRenderedChallenge(null), DRAWER_TRANSITION_MS);
    }

    return () => {
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
    };
  }, [challenge]);

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", handleTab);
    return () => dialog.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  useEffect(() => {
    if (!renderedChallenge) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [renderedChallenge]);

  useEffect(() => {
    if (!renderedChallenge) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, renderedChallenge]);

  if (!renderedChallenge) return null;

  const Icon = categoryIcons[renderedChallenge.category as keyof typeof categoryIcons] ?? BrainCircuit;
  const active = isChallengeActive(renderedChallenge.id, location.pathname);
  const status = active ? "in-progress" : renderedChallenge.status;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        aria-label="Close challenge preview"
        onClick={onClose}
        className={`absolute inset-0 h-full w-full cursor-default bg-[#020608]/75 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="challenge-preview-title"
        className={`absolute right-0 top-0 h-full w-full max-w-[480px] overflow-y-auto border-l border-white/10 bg-[#0C141A] p-5 shadow-[-30px_0_90px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out motion-reduce:transition-none sm:p-7 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[#45A29E]">Mission preview</p>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="rounded-lg border border-white/10 p-2 text-[#C5C6C7]/65 transition hover:border-[#66FCF1]/35 hover:text-white" aria-label="Close challenge preview">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#66FCF1]/20 bg-[#101F27] text-[#66FCF1]"><Icon className="h-6 w-6" /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">Stage {String(renderedChallenge.stage).padStart(2, "0")}</span><ChallengeStatusBadge status={status} /></div>
            <h2 id="challenge-preview-title" className="mt-2 text-2xl font-semibold leading-tight text-white">{renderedChallenge.title}</h2>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-[#C5C6C7]/68">{renderedChallenge.summary}</p>
        <div className="mt-5"><ChallengeMetadata difficulty={renderedChallenge.difficulty} estimatedTime={renderedChallenge.estimatedTime} rewardXp={renderedChallenge.rewardXp} /></div>
        <div className="mt-7 rounded-2xl border border-white/8 bg-[#101820] p-4"><p className="mb-3 text-xs uppercase tracking-[0.16em] text-[#45A29E]">Workflow preview</p><WorkflowStrip steps={renderedChallenge.workflow} /></div>
        <div className="mt-6"><p className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">What you&apos;ll learn</p><p className="mt-2 text-sm leading-6 text-white">{renderedChallenge.outcome}</p></div>
        <div className="mt-6"><p className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">Mission objectives</p><ul className="mt-3 space-y-2">{renderedChallenge.objectives.map((objective) => <li key={objective} className="flex gap-2 rounded-xl border border-white/8 bg-[#101820] px-3 py-2.5 text-xs leading-5 text-[#C5C6C7]/70"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#66FCF1]" />{objective}</li>)}</ul></div>
        <div className="mt-6"><p className="text-xs uppercase tracking-[0.16em] text-[#45A29E]">Components you&apos;ll use</p><div className="mt-3 flex flex-wrap gap-2">{renderedChallenge.supportedComponents.map((component) => <span key={component} className="rounded-md border border-white/8 bg-[#101820] px-2.5 py-1.5 text-[11px] text-[#C5C6C7]/70">{component}</span>)}</div></div>

        <div className="mt-8 flex flex-col gap-3">
          <Link to={getChallengeStartPath(renderedChallenge)} onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#66FCF1] px-4 py-3 text-sm font-semibold text-[#0B0C10] transition hover:bg-[#8ffdf6]">
            {active ? "Continue challenge" : "Start challenge"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to={`/challenge/${renderedChallenge.id}`} onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm text-[#C5C6C7]/75 transition hover:border-[#66FCF1]/35 hover:text-white">Open challenge description</Link>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-3 text-sm text-[#C5C6C7]/75 transition hover:border-[#66FCF1]/35 hover:text-white">Keep browsing</button>
        </div>
      </aside>
    </div>
  );
}
