import { ArrowRight, Award, CheckCircle2, Flame, Gauge, Layers3, Sparkles, Trophy, Workflow, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { playerProfile } from "../../data/challenges";
import { homeAgentPreview, homeProofMetrics } from "../../data/homeVisualizationData";
import { HomeLearningLoop } from "../../features/home/HomeLearningLoop";
import { LearningPath } from "../../features/home/LearningPath";

export function HomePage() {
  return (
    <div className="space-y-12 pb-8">
      <section className="grid items-center gap-8 pt-2 xl:grid-cols-[0.88fr_1.12fr] xl:gap-12 xl:pt-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#66FCF1]/15 bg-[#66FCF1]/8 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#66FCF1]"><span className="h-1.5 w-1.5 rounded-full bg-[#66FCF1] shadow-[0_0_12px_#66FCF1]" /> A visual learning arcade for engineers</div>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl xl:text-6xl">Build systems.<br /><span className="text-[#66FCF1]">Watch them run.</span><br />Learn why they work.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#C5C6C7]/68 sm:text-lg">EngineerVerse turns engineering concepts into playable workflows. Compose the system, simulate the behavior, verify the result, and understand the tradeoffs behind every decision.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/challenges">Explore Challenges <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline" size="lg"><a href="#learning-loop">See the learning loop <Workflow className="h-4 w-4" /></a></Button></div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">{homeProofMetrics.map((metric) => <div key={metric.label} className="rounded-2xl border border-white/8 bg-[#101820]/75 p-3 sm:p-4"><p className="text-xl font-semibold text-white sm:text-2xl">{metric.value}</p><p className="mt-1 text-[10px] leading-4 text-[#C5C6C7]/50 sm:text-xs">{metric.label}</p></div>)}</div>
        </div>
        <HomeLearningLoop />
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#101820]/72 p-5 sm:p-7">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-[#45A29E]">The learning loop</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Every challenge follows the same loop.</h2></div><p className="max-w-md text-sm leading-6 text-[#C5C6C7]/55">The visual trace is the teacher: it turns invisible system behavior into something you can inspect, question, and improve.</p></div>
        <div className="mt-7 grid gap-3 md:grid-cols-3 md:gap-0">{[
          { icon: Layers3, label: "Build", text: "Compose real systems from understandable components." },
          { icon: Zap, label: "Observe", text: "Watch data, agents, and events move through the workflow." },
          { icon: Gauge, label: "Improve", text: "Use verification and scoring to understand what changed." },
        ].map((item, index) => <div key={item.label} className="relative flex gap-4 rounded-2xl border border-white/6 bg-[#0B0C10]/55 p-4 md:rounded-none md:border-0 md:bg-transparent md:px-5 md:first:pl-0 md:last:pr-0"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#66FCF1]/15 bg-[#66FCF1]/8 text-[#66FCF1]"><item.icon className="h-5 w-5" /></div><div><h3 className="font-semibold text-white">{item.label}</h3><p className="mt-1 text-sm leading-6 text-[#C5C6C7]/55">{item.text}</p></div>{index < 2 && <ArrowRight className="absolute -bottom-4 left-1/2 hidden h-4 w-4 translate-x-1/2 rotate-90 text-[#66FCF1]/45 md:-right-2 md:bottom-auto md:left-auto md:top-5 md:block md:translate-x-0 md:rotate-0" />}</div>)}
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-[#45A29E]">Your progression</p><h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Five ways to grow your systems thinking.</h2></div><Link to="/challenges" className="inline-flex items-center gap-2 text-sm font-medium text-[#66FCF1]">View all missions <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="mt-6"><LearningPath /></div>
      </section>

      <section className="rounded-3xl border border-white/8 bg-[#101820] p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#66FCF1]/15 bg-[#0B0C10] text-[#66FCF1]"><Trophy className="h-5 w-5" /></div><div><p className="text-xs uppercase tracking-[0.18em] text-[#45A29E]">Your progress</p><h2 className="mt-1 text-xl font-semibold text-white">Keep the streak alive, {playerProfile.name}.</h2></div></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><ProgressStat icon={Award} label="Level" value={`${playerProfile.level}`} /><ProgressStat icon={Sparkles} label="XP" value={playerProfile.totalXp.toLocaleString()} /><ProgressStat icon={Flame} label="Streak" value={`${playerProfile.streakDays} days`} /><ProgressStat icon={Trophy} label="Rank" value={playerProfile.rank} /></div></div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#0B0C10]"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#45A29E] to-[#66FCF1]" /></div><span className="text-xs text-[#C5C6C7]/50 sm:ml-4">72% to 3,000 XP</span></div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-[#66FCF1]/15 bg-[radial-gradient(circle_at_top_right,rgba(102,252,241,0.14),transparent_34%),#0F1D23] p-6 sm:p-8"><div className="relative z-10 grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-center"><div><p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#66FCF1]"><CheckCircle2 className="h-4 w-4" /> Strongest working experience</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Start with a real agent workflow.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#C5C6C7]/62">Use a dataset, ask a question, and watch five agents turn it into verified SQL and a result you can inspect.</p><Button asChild className="mt-6"><Link to="/challenge/agent-sql-001">Try Text-to-SQL <ArrowRight className="h-4 w-4" /></Link></Button></div><div className="rounded-2xl border border-white/10 bg-[#091116]/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"><div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-[#C5C6C7]/45"><span>{homeAgentPreview.dataset}</span><span className="text-[#66FCF1]">Verified</span></div><p className="mt-3 text-sm font-medium text-white">{homeAgentPreview.question}</p><pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl border border-white/8 bg-[#0B0C10] p-3 text-[10px] leading-5 text-[#C5C6C7]/72">{homeAgentPreview.sql}</pre><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-semibold text-[#66FCF1]">{homeAgentPreview.result}</span><span className="text-[10px] text-[#C5C6C7]/48">{homeAgentPreview.takeaway}</span></div></div></div></section>
    </div>
  );
}

function ProgressStat({ icon: Icon, label, value }: { icon: typeof Award; label: string; value: string }) {
  return <div className="rounded-xl border border-white/8 bg-[#0B0C10]/65 px-3 py-2.5"><div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[#C5C6C7]/45"><Icon className="h-3 w-3 text-[#45A29E]" />{label}</div><p className="mt-1 text-sm font-semibold text-white">{value}</p></div>;
}
