import { useState } from "react";
import { ArrowRight, Gauge, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ChallengeCard } from "../../components/cards/ChallengeCard";
import { ChallengePreviewDrawer } from "../../components/challenges/ChallengePreviewDrawer";
import { challenges } from "../../data/challenges";
import type { Challenge } from "../../types";
import { getChallengeStartPath } from "../../lib/challenge-routing";

export function OptimizersPage() {
  const [preview, setPreview] = useState<Challenge | null>(null);
  const optimizerChallenges = challenges.filter((challenge) => challenge.category === "Optimize");
  const optimizer = optimizerChallenges[0] ?? challenges[0];

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-[30px] border border-[#66FCF1]/20 bg-[radial-gradient(circle_at_top_right,rgba(102,252,241,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(69,162,158,0.18),transparent_38%),#0F1D23] p-7 shadow-[0_24px_90px_rgba(0,0,0,0.26)] sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-[#66FCF1]/10 bg-[#66FCF1]/8 blur-2xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#66FCF1]/25 bg-[#66FCF1]/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#66FCF1]"><Sparkles className="h-3.5 w-3.5" /> Performance lab</div>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Tune the system until the curve changes.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#C5C6C7]/68">Optimizers are focused experiments for understanding speed, cost, convergence, and the tradeoffs behind better systems.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to={getChallengeStartPath(optimizer)}>Open optimizer <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/challenges">Browse all challenges</Link></Button>
          </div>
        </div>
        <div className="relative z-10 mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
          {[{ icon: Gauge, label: "Convergence" }, { icon: Zap, label: "Latency" }, { icon: Sparkles, label: "Tradeoffs" }].map(({ icon: Icon, label }) => <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#091116]/55 px-4 py-3 text-sm text-[#C5C6C7]/75"><Icon className="h-4 w-4 text-[#66FCF1]" />{label}</div>)}
        </div>
      </section>

      <section className="space-y-4">
        <div><p className="text-xs uppercase tracking-[0.2em] text-[#45A29E]">Optimizer missions</p><h2 className="mt-2 text-2xl font-semibold text-white">Specialized challenges for performance thinking.</h2></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{optimizerChallenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} onPreview={setPreview} />)}</div>
      </section>

      <ChallengePreviewDrawer challenge={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
