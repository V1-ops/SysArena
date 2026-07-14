import { useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, Database, Filter, Search, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ChallengeCard } from "../../components/cards/ChallengeCard";
import { ChallengeMetadata } from "../../components/challenges/ChallengeMetadata";
import { ChallengePreviewDrawer } from "../../components/challenges/ChallengePreviewDrawer";
import { ChallengeStatusBadge } from "../../components/challenges/ChallengeStatusBadge";
import { WorkflowStrip } from "../../components/challenges/WorkflowStrip";
import { challenges, challengeCategories } from "../../data/challenges";
import type { Challenge } from "../../types";
import { cn } from "../../lib/utils";
import { getChallengeStartPath } from "../../lib/challenge-routing";

type SortOption = "learning" | "reward" | "shortest" | "difficulty";
type DifficultyFilter = "All" | "Easy" | "Medium" | "Hard";

const difficultyRank = { Easy: 1, Medium: 2, Hard: 3 } as const;

export function ChallengeListingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<(typeof challengeCategories)[number]>("All");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("All");
  const [sort, setSort] = useState<SortOption>("learning");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const featured = challenges.find((challenge) => challenge.stage === 1) ?? challenges[0];
  const filteredChallenges = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const results = challenges.filter((challenge) => {
      const searchable = [challenge.title, challenge.summary, challenge.outcome, challenge.category, ...challenge.tags].join(" ").toLowerCase();
      return (!query || searchable.includes(query)) && (category === "All" || challenge.category === category) && (difficulty === "All" || challenge.difficulty === difficulty);
    });

    return [...results].sort((first, second) => {
      if (sort === "reward") return second.rewardXp - first.rewardXp;
      if (sort === "shortest") return parseMinutes(first.estimatedTime) - parseMinutes(second.estimatedTime);
      if (sort === "difficulty") return (difficultyRank[first.difficulty as keyof typeof difficultyRank] ?? 9) - (difficultyRank[second.difficulty as keyof typeof difficultyRank] ?? 9);
      return first.stage - second.stage;
    });
  }, [category, difficulty, searchTerm, sort]);

  const hasFilters = Boolean(searchTerm || category !== "All" || difficulty !== "All" || sort !== "learning");
  const clearFilters = () => { setSearchTerm(""); setCategory("All"); setDifficulty("All"); setSort("learning"); };

  return (
    <div className="space-y-10 pb-8">
      <section className="relative overflow-hidden rounded-[30px] border border-[#66FCF1]/15 bg-[radial-gradient(circle_at_top_right,rgba(102,252,241,0.13),transparent_34%),#0F1B22] p-6 sm:p-8"><div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#66FCF1]/10 blur-3xl" /><div className="relative z-10 grid gap-8 xl:grid-cols-[1fr_0.95fr] xl:items-center"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#66FCF1]/15 bg-[#66FCF1]/8 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#66FCF1]"><Target className="h-3.5 w-3.5" /> Mission Control</div><h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">Choose the next system to <span className="text-[#66FCF1]">understand.</span></h1><p className="mt-4 max-w-xl text-base leading-7 text-[#C5C6C7]/65">Every mission is a visual engineering challenge: compose the workflow, watch it execute, and learn what makes the system reliable.</p><div className="mt-6 flex flex-wrap gap-2"><CatalogMetric value="05" label="learning stages" /><CatalogMetric value="05" label="engineering modes" /><CatalogMetric value="34m" label="total mission time" /></div></div><div className="rounded-2xl border border-white/10 bg-[#091116]/85 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#45A29E]"><Database className="h-4 w-4 text-[#66FCF1]" />Recommended first step</div><ChallengeStatusBadge status={featured.status} /></div><h2 className="mt-4 text-2xl font-semibold leading-tight text-white">{featured.title}</h2><p className="mt-2 text-sm leading-6 text-[#C5C6C7]/60">{featured.outcome}</p><div className="mt-5 rounded-xl border border-white/8 bg-[#101820] p-3"><WorkflowStrip steps={featured.workflow} compact /></div><div className="mt-4"><ChallengeMetadata difficulty={featured.difficulty} estimatedTime={featured.estimatedTime} rewardXp={featured.rewardXp} /></div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => setSelectedChallenge(featured)} className="inline-flex items-center gap-2 rounded-lg bg-[#66FCF1] px-4 py-2.5 text-sm font-semibold text-[#0B0C10] hover:bg-[#8ffdf6]">Preview mission <ArrowRight className="h-4 w-4" /></button><Button asChild variant="outline"><Link to={getChallengeStartPath(featured)}>Start building</Link></Button></div></div></div></section>

      <section className="space-y-5"><div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-[#45A29E]">Challenge library</p><h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Find a mission that matches your next skill.</h2></div><p className="text-sm text-[#C5C6C7]/50">{filteredChallenges.length} of {challenges.length} missions visible</p></div><div className="rounded-2xl border border-white/8 bg-[#101820] p-3"><div className="flex flex-col gap-3 xl:flex-row xl:items-center"><label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#45A29E]" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search missions, skills, or concepts..." className="w-full rounded-xl border border-white/8 bg-[#0B0C10] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#C5C6C7]/35 focus:border-[#66FCF1]/45" /></label><div className="flex flex-wrap items-center gap-2"><Filter className="h-4 w-4 text-[#45A29E]" /><select value={difficulty} onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)} className="rounded-lg border border-white/8 bg-[#0B0C10] px-3 py-2.5 text-xs text-[#C5C6C7]/75 outline-none focus:border-[#66FCF1]/40"><option value="All">All difficulties</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select><select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="rounded-lg border border-white/8 bg-[#0B0C10] px-3 py-2.5 text-xs text-[#C5C6C7]/75 outline-none focus:border-[#66FCF1]/40"><option value="learning">Recommended order</option><option value="reward">Highest reward</option><option value="shortest">Shortest mission</option><option value="difficulty">Difficulty</option></select>{hasFilters && <button type="button" onClick={clearFilters} className="px-2 text-xs font-medium text-[#66FCF1] hover:text-white">Clear</button>}</div></div><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{challengeCategories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs transition", item === category ? "border-[#66FCF1]/30 bg-[#66FCF1]/10 text-[#66FCF1]" : "border-white/8 bg-[#0B0C10] text-[#C5C6C7]/60 hover:border-[#66FCF1]/20 hover:text-white")}>{item}</button>)}</div></div></section>

      {filteredChallenges.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredChallenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} onPreview={setSelectedChallenge} />)}</div> : <div className="rounded-2xl border border-dashed border-white/10 bg-[#101820]/70 p-12 text-center"><Sparkles className="mx-auto h-8 w-8 text-[#45A29E]" /><h2 className="mt-4 text-xl font-semibold text-white">No missions match that search.</h2><p className="mt-2 text-sm text-[#C5C6C7]/55">Try a different concept or clear the filters to see the full learning path.</p><button type="button" onClick={clearFilters} className="mt-5 text-sm font-medium text-[#66FCF1] hover:text-white">Clear all filters</button></div>}
      <ChallengePreviewDrawer challenge={selectedChallenge} onClose={() => setSelectedChallenge(null)} />
    </div>
  );
}

function CatalogMetric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl border border-white/8 bg-[#091116]/65 px-3 py-2.5"><p className="text-lg font-semibold text-white">{value}</p><p className="text-[10px] uppercase tracking-[0.12em] text-[#C5C6C7]/45">{label}</p></div>;
}

function parseMinutes(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 999;
}
