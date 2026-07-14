import { useEffect, useState } from "react";
import { Activity, ArrowRight, Check, CircleDot, Code2, Database, Eye, GitBranch, Play, ShieldCheck, Sparkles } from "lucide-react";
import { homeLoopStages, type HomeLoopStage } from "../../data/homeVisualizationData";

const stageIcons = {
  observe: Eye,
  build: GitBranch,
  simulate: Play,
  verify: ShieldCheck,
  understand: Sparkles,
} as const;

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export function HomeLearningLoop() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const activeStage = homeLoopStages[activeIndex];

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % homeLoopStages.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  return (
    <section
      id="learning-loop"
      aria-label="EngineerVerse learning loop"
      className="relative overflow-hidden rounded-[30px] border border-[#66FCF1]/15 bg-[#0D171D] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.42)] sm:p-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(102,252,241,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(102,252,241,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#66FCF1]/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#66FCF1]/15 bg-[#66FCF1]/8 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#66FCF1]">
            <span className={`h-1.5 w-1.5 rounded-full bg-[#66FCF1] ${paused || reducedMotion ? "" : "animate-pulse"}`} />
            {paused ? "Exploring" : "Live learning loop"}
          </div>
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#C5C6C7]/40">Stage {String(activeIndex + 1).padStart(2, "0")} / 05</span>
        </div>

        <div className="mt-5 grid grid-cols-5 gap-1.5">
          {homeLoopStages.map((stage, index) => {
            const Icon = stageIcons[stage.id];
            const active = index === activeIndex;
            return (
              <button
                key={stage.id}
                type="button"
                aria-label={`View ${stage.label} stage`}
                aria-pressed={active}
                onClick={() => setActiveIndex(index)}
                className={`group rounded-xl border px-2 py-2 text-left transition-all duration-300 ${active ? "border-[#66FCF1]/45 bg-[#66FCF1]/12 text-white shadow-[0_0_24px_rgba(102,252,241,0.12)]" : "border-white/8 bg-[#0A1116]/65 text-[#C5C6C7]/48 hover:border-[#66FCF1]/25 hover:text-[#C5C6C7]"}`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-[#66FCF1]" : "text-[#45A29E]/70"}`} />
                <span className="mt-1.5 block text-[10px] font-medium sm:text-xs">{stage.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative mt-4 min-h-[300px] overflow-hidden rounded-2xl border border-white/8 bg-[#091116]/90 p-4 sm:p-5">
          <div className="absolute left-[10%] right-[10%] top-[42%] hidden h-px bg-gradient-to-r from-transparent via-[#45A29E]/50 to-transparent sm:block" />
          <div className="absolute left-[22%] top-[39%] hidden h-2 w-2 rounded-full bg-[#66FCF1] shadow-[0_0_18px_#66FCF1] sm:block" />
          <div className="absolute left-[50%] top-[39%] hidden h-2 w-2 rounded-full bg-[#66FCF1] shadow-[0_0_18px_#66FCF1] sm:block" />
          <div className="absolute right-[22%] top-[39%] hidden h-2 w-2 rounded-full bg-[#66FCF1] shadow-[0_0_18px_#66FCF1] sm:block" />
          <StageArtifact stage={activeStage} activeIndex={activeIndex} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#C5C6C7]/55">
          <span>{activeStage.description}</span>
          <span className="hidden shrink-0 items-center gap-1 text-[#66FCF1] sm:inline-flex">Click a stage <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </section>
  );
}

function StageArtifact({ stage, activeIndex }: { stage: HomeLoopStage; activeIndex: number }) {
  if (stage.id === "observe") {
    return (
      <div className="relative z-10 flex h-full min-h-[260px] flex-col justify-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#45A29E]">{stage.eyebrow}</p>
        <div className="mt-4 max-w-[90%] rounded-2xl border border-[#66FCF1]/20 bg-[#11232A] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.25)] sm:max-w-[78%]">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#C5C6C7]/45"><Database className="h-3.5 w-3.5 text-[#66FCF1]" /> Retail Sales / Natural language</div>
          <p className="mt-4 text-lg font-medium leading-7 text-white">“What were total sales by category?”</p>
          <div className="mt-4 h-1.5 w-32 rounded-full bg-[#66FCF1]/25" />
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-[#C5C6C7]/55"><CircleDot className="h-3.5 w-3.5 text-[#66FCF1]" /> A question becomes a buildable mission.</div>
      </div>
    );
  }

  if (stage.id === "build") {
    return (
      <div className="relative z-10 flex min-h-[260px] flex-col justify-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#45A29E]">{stage.eyebrow}</p>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {["Planner", "Researcher", "Coder", "Tester", "Reviewer"].map((node, index) => (
            <div key={node} className={`relative rounded-xl border p-3 transition-all duration-500 ${index === activeIndex % 5 ? "border-[#66FCF1]/50 bg-[#66FCF1]/12 shadow-[0_0_28px_rgba(102,252,241,0.13)]" : "border-white/10 bg-[#101B21]"}`}>
              <div className="h-1.5 w-7 rounded-full bg-[#66FCF1]/70" />
              <p className="mt-3 text-xs font-medium text-white">{node}</p>
              <p className="mt-1 text-[10px] text-[#C5C6C7]/45">agent node</p>
              {index < 4 && <ArrowRight className="absolute -right-3 top-1/2 z-20 hidden h-4 w-4 -translate-y-1/2 text-[#66FCF1]/70 sm:block" />}
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-[#C5C6C7]/55">A visible graph makes orchestration easier to reason about.</p>
      </div>
    );
  }

  if (stage.id === "simulate") {
    return (
      <div className="relative z-10 flex min-h-[260px] flex-col justify-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#45A29E]">{stage.eyebrow}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-white/8 bg-[#101B21] p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-white"><Activity className="h-4 w-4 text-[#66FCF1]" /> Execution trace</div>
            <div className="mt-4 space-y-3">
              {["Planner complete", "Schema inspected", "SQL generated", "Tester running"].map((event, index) => <div key={event} className="flex items-center gap-2 text-[11px] text-[#C5C6C7]/65"><span className={`h-2 w-2 rounded-full ${index === 3 ? "animate-pulse bg-[#66FCF1] shadow-[0_0_12px_#66FCF1]" : "bg-[#45A29E]"}`} />{event}</div>)}
            </div>
          </div>
          <div className="rounded-xl border border-[#66FCF1]/20 bg-[#0D242B] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#66FCF1]">Active agent</p>
            <p className="mt-3 text-2xl font-semibold text-white">Tester</p>
            <p className="mt-2 text-xs leading-5 text-[#C5C6C7]/60">Checking whether the SQL is read-only and executable.</p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#16333A]"><div className="h-full w-2/3 animate-pulse rounded-full bg-[#66FCF1]" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (stage.id === "verify") {
    return (
      <div className="relative z-10 flex min-h-[260px] flex-col justify-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#45A29E]">{stage.eyebrow}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {["SQL is read-only", "Query executed successfully", "Results returned", "Verification completed"].map((check) => <div key={check} className="flex items-center gap-3 rounded-xl border border-[#66FCF1]/12 bg-[#0F2228] px-3 py-3 text-xs text-[#C5C6C7]/75"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#66FCF1]/12"><Check className="h-3.5 w-3.5 text-[#66FCF1]" /></span>{check}</div>)}
        </div>
        <p className="mt-5 text-xs text-[#C5C6C7]/55">Verification turns a plausible output into a trustworthy one.</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex min-h-[260px] flex-col justify-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#45A29E]">{stage.eyebrow}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-white/8 bg-[#101B21] p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#C5C6C7]/45"><Code2 className="h-3.5 w-3.5 text-[#66FCF1]" /> Verified SQL</div>
          <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-5 text-[#C5C6C7]/80">{`SELECT category,\nSUM(units_sold * unit_price)\nFROM dataset\nGROUP BY category;`}</pre>
        </div>
        <div className="rounded-xl border border-[#66FCF1]/20 bg-[#0D242B] p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#66FCF1]">Result</p>
          <p className="mt-3 text-xl font-semibold text-white">$1,211</p>
          <p className="mt-1 text-xs text-[#C5C6C7]/60">Electronics</p>
          <p className="mt-5 text-[11px] leading-4 text-[#C5C6C7]/55">Learn from the artifact, not just the answer.</p>
        </div>
      </div>
    </div>
  );
}
