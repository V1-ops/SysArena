import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { challengeCategories, challenges } from "../../data/challenges";
import { PageHeader } from "../../components/common/PageHeader";
import { Card, CardContent } from "../../components/ui/card";
import { ChallengeCard } from "../../components/cards/ChallengeCard";
import { cn } from "../../lib/utils";

export function ChallengeListingPage() {
  const [category, setCategory] = useState<(typeof challengeCategories)[number]>("All");

  const filtered = useMemo(() => {
    if (category === "All") return challenges;
    return challenges.filter((challenge) => challenge.category === category);
  }, [category]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mission Library"
        title="Challenges"
        description="Browse fast-paced engineering missions across system design, AI retrieval, agents, debugging, and optimization."
      />

      <div className="flex flex-wrap gap-3">
        {challengeCategories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-all",
              item === category
                ? "border-[#66FCF1]/25 bg-[#66FCF1]/10 text-[#66FCF1]"
                : "border-white/6 bg-white/5 text-[#C5C6C7]/75 hover:border-[#66FCF1]/15 hover:bg-[#66FCF1]/5"
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#45A29E]">
              Featured Challenge
            </p>
            <h2 className="text-2xl font-semibold text-white">{challenges[0].title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-[#C5C6C7]/65">
              {challenges[0].summary}
            </p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/5 bg-[#0F151B] px-4 py-3 text-sm text-[#C5C6C7]/70">
            <Search className="h-4 w-4 text-[#66FCF1]" />
            Search and sort coming next
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}
