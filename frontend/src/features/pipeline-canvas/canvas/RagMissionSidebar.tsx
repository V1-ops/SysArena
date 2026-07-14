import { Check, ChevronDown, ChevronUp, Circle, ClipboardList, Compass, FileText, Gauge, Layers3, PanelRight, Play, RotateCcw, Sparkles, Target, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useGraphStore } from "../hooks/useGraphStore";
import { EventLog } from "./EventLog";
import { PropertiesPanel } from "./PropertiesPanel";
import { ScoreOverlay } from "./ScoreOverlay";
import { SubmitPanel } from "./SubmitPanel";

interface SectionProps {
  title: string;
  icon: typeof Compass;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function Section({ title, icon: Icon, summary, open, onToggle, children }: SectionProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/8 bg-[#101820] shadow-[0_16px_45px_rgba(0,0,0,0.16)]">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]">
        <span className="flex min-w-0 items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0 text-[#66FCF1]" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">{title}</span>
            {summary && <span className="mt-0.5 block truncate text-[11px] text-[#C5C6C7]/48">{summary}</span>}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-[#C5C6C7]/55" /> : <ChevronDown className="h-4 w-4 shrink-0 text-[#C5C6C7]/55" />}
      </button>
      {open && <div className="border-t border-white/8 p-3">{children}</div>}
    </section>
  );
}

const progressStages = [
  ["pdf-loader", "Load PDF"],
  ["chunker", "Split text"],
  ["embedder", "Create embeddings"],
  ["vector-db", "Store vectors"],
  ["retriever", "Retrieve context"],
  ["reranker", "Rerank evidence"],
  ["prompt-template", "Build prompt"],
  ["llm", "Generate answer"],
] as const;

export function RagMissionSidebar() {
  const navigate = useNavigate();
  const config = useGraphStore((state) => state.config);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const runState = useGraphStore((state) => state.runState);
  const eventLog = useGraphStore((state) => state.eventLog);
  const response = useGraphStore((state) => state.lastResponse);
  const errorMessage = useGraphStore((state) => state.errorMessage);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    brief: true,
    progress: true,
    node: true,
    simulation: true,
    trace: false,
    score: true,
  });

  const nodeTypes = useMemo(() => new Set(nodes.map((node) => node.data.nodeTypeId)), [nodes]);
  const completedStages = progressStages.filter(([id]) => nodeTypes.has(id)).length;
  const activeEvent = eventLog.find((entry) => entry.status === "running") ?? eventLog[0];
  const invalidEdges = edges.filter((edge) => edge.data?.isSemanticallyValid === false).length;
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  function toggle(section: string) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  const content = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1 pb-1">
        <div className="flex items-center gap-2">
          <PanelRight className="h-4 w-4 text-[#66FCF1]" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#45A29E]">Mission Control</p>
            <p className="mt-1 text-sm font-semibold text-white">Business Basics RAG</p>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${runState === "completed" ? "border-[#45A29E]/35 bg-[#45A29E]/10 text-[#66FCF1]" : "border-white/10 bg-[#0B0C10] text-[#C5C6C7]/55"}`}>
          {runState === "idle" ? "Building" : runState}
        </span>
      </div>

      {runState === "running" || runState === "submitting" ? (
        <div className="rounded-xl border border-[#66FCF1]/25 bg-[#66FCF1]/8 px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#66FCF1]"><Play className="h-3.5 w-3.5 animate-pulse" /> Simulation running</div>
          <p className="mt-2 text-xs leading-5 text-[#C5C6C7]/70">Watch the highlighted nodes on the canvas as the document moves through your pipeline.</p>
        </div>
      ) : null}

      <Section title="Challenge Brief" icon={Compass} summary="Build a grounded answer pipeline" open={openSections.brief} onToggle={() => toggle("brief")}>
        <div className="space-y-3 text-xs leading-5 text-[#C5C6C7]/68">
          <div className="rounded-lg border border-[#45A29E]/20 bg-[#0B0C10] p-3">
            <div className="flex items-center gap-2 text-[#66FCF1]"><FileText className="h-4 w-4" /><span className="font-semibold text-white">Business Basics PDF</span></div>
            <p className="mt-2">The source document is already loaded. Design the pipeline that turns it into reliable evidence and a grounded answer.</p>
          </div>
          <div className="flex items-start gap-2"><Target className="mt-0.5 h-4 w-4 shrink-0 text-[#66FCF1]" /><p>Connect every stage into one flow. Retrieval, reranking, prompt construction, and generation should all be visible.</p></div>
        </div>
      </Section>

      <Section title="Pipeline Progress" icon={Layers3} summary={`${completedStages}/${progressStages.length} components placed`} open={openSections.progress} onToggle={() => toggle("progress")}>
        <div className="space-y-1.5">
          {progressStages.map(([id, label]) => {
            const present = nodeTypes.has(id);
            return <div key={id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs"><span className={present ? "text-[#66FCF1]" : "text-[#C5C6C7]/25"}>{present ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}</span><span className={present ? "text-[#C5C6C7]" : "text-[#C5C6C7]/48"}>{label}</span></div>;
          })}
        </div>
        {invalidEdges > 0 && <div className="mt-3 rounded-lg border border-amber-400/25 bg-amber-950/20 px-3 py-2 text-xs leading-5 text-amber-100"><span className="font-semibold">{invalidEdges} flow warning{invalidEdges > 1 ? "s" : ""}.</span> These connections are allowed for exploration but will reduce your score.</div>}
      </Section>

      <Section title="Selected Node" icon={ClipboardList} summary={selectedNode ? "Configure the selected component" : "Select a node on the canvas"} open={openSections.node} onToggle={() => toggle("node")}>
        <PropertiesPanel embedded />
      </Section>

      <Section title="Simulation" icon={Gauge} summary="Ask a question and run your graph" open={openSections.simulation} onToggle={() => toggle("simulation")}>
        <SubmitPanel embedded />
      </Section>

      <Section title="Live Trace" icon={Sparkles} summary={activeEvent ? activeEvent.nodeLabel : "Run the simulation to inspect execution"} open={openSections.trace} onToggle={() => toggle("trace")}>
        <EventLog embedded />
      </Section>

      <Section title="Score Preview" icon={Target} summary={response ? `${Math.round(response.score.overall * 100)}% current score` : "No score yet"} open={openSections.score} onToggle={() => toggle("score")}>
        <ScoreOverlay embedded />
        {response && <button type="button" onClick={() => navigate(`/result/${config.challengeMeta.challengeId}`)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#66FCF1]/30 bg-[#66FCF1]/10 px-4 py-2.5 text-sm font-semibold text-[#66FCF1] transition hover:bg-[#66FCF1]/15">View Scorecard</button>}
      </Section>

      {errorMessage && <div className="rounded-lg border border-red-400/20 bg-red-950/30 px-3 py-2 text-xs leading-5 text-red-100">{errorMessage}</div>}
      <button type="button" onClick={() => setMobileOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#0B0C10] px-3 py-2 text-xs text-[#C5C6C7]/65 hover:border-[#66FCF1]/35 hover:text-white xl:hidden"><X className="h-3.5 w-3.5" /> Close Mission Control</button>
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setMobileOpen((open) => !open)} className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-[#66FCF1]/35 bg-[#101820]/95 px-4 py-3 text-sm font-semibold text-[#66FCF1] shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur xl:hidden"><PanelRight className="h-4 w-4" /> Mission Control</button>
      <aside className={`${mobileOpen ? "block" : "hidden"} fixed inset-x-3 bottom-3 top-20 z-20 overflow-y-auto rounded-2xl border border-white/10 bg-[#0B0C10]/[.98] p-3 shadow-[0_25px_80px_rgba(0,0,0,0.65)] backdrop-blur xl:sticky xl:top-5 xl:block xl:max-h-[calc(100vh-2rem)] xl:rounded-xl xl:bg-transparent xl:p-0 xl:shadow-none`}>
        {content}
      </aside>
    </>
  );
}
