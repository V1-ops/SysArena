import { BrainCircuit, Bug, Cpu, Rocket, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { dailyChallenge, playerProfile } from "../../data/challenges";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionHeader } from "../../components/common/SectionHeader";
import { GameCard } from "../../components/cards/GameCard";
import { ProgressBar } from "../../components/common/ProgressBar";

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-8 p-8 md:p-10">
            <PageHeader
              eyebrow="Engineering Arcade"
              title={`Welcome back, ${playerProfile.name}!`}
              description="Build, simulate, debug, and optimize premium engineering challenges in a game-like flow that rewards mastery."
            />

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={`/challenge/${dailyChallenge.id}`}>Play Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/challenges">Browse Challenges</Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <QuickStat title="Level" value={`${playerProfile.level}`} />
              <QuickStat title="Challenges Completed" value="28" />
              <QuickStat title="Current Rank" value={playerProfile.rank} />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="relative flex min-h-[320px] items-center justify-center p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(102,252,241,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(69,162,158,0.12),transparent_28%)]" />
            <div className="absolute left-10 top-10 rounded-2xl border border-[#66FCF1]/15 bg-[#111a22]/80 p-3 text-[#66FCF1]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="absolute right-10 top-14 rounded-2xl border border-[#66FCF1]/15 bg-[#111a22]/80 p-3 text-[#66FCF1]">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="absolute bottom-12 left-12 rounded-2xl border border-[#66FCF1]/15 bg-[#111a22]/80 p-3 text-[#66FCF1]">
              <Rocket className="h-5 w-5" />
            </div>
            <div className="relative flex items-end gap-4">
              <Cube size="lg" />
              <div className="mb-10 flex flex-col gap-4">
                <Cube />
                <Cube size="sm" />
              </div>
              <div className="flex flex-col gap-4">
                <Cube size="xl" />
                <Cube size="xs" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="grid gap-6 p-6 md:grid-cols-[220px_1fr_auto] md:items-center">
            <div className="flex h-[180px] items-center justify-center rounded-[28px] border border-[#66FCF1]/15 bg-[radial-gradient(circle_at_top,rgba(102,252,241,0.18),transparent_45%),#101920]">
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-[#66FCF1]/20 bg-[#12202a] shadow-[0_0_40px_rgba(102,252,241,0.15)]">
                <Trophy className="h-12 w-12 text-[#66FCF1]" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[#C5C6C7]/70">
                <Sparkles className="h-4 w-4 text-[#66FCF1]" />
                Daily Challenge
              </div>
              <div>
                <h2 className="text-3xl font-semibold leading-tight text-white">
                  {dailyChallenge.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#C5C6C7]/65">
                  {dailyChallenge.summary}
                </p>
              </div>
              <Button asChild size="lg">
                <Link to={`/challenge/${dailyChallenge.id}`}>Start Challenge</Link>
              </Button>
            </div>
            <div className="md:justify-self-end">
              <div className="rounded-2xl border border-[#45A29E]/12 bg-[#0F151B] px-5 py-4 text-right">
                <p className="text-xs uppercase tracking-[0.22em] text-[#C5C6C7]/45">Reward</p>
                <p className="mt-2 text-xl font-semibold text-[#66FCF1]">
                  {dailyChallenge.rewardXp} XP
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <SectionHeader title="Progress" />
            <div className="rounded-2xl border border-white/5 bg-[#0F151B] p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-[#C5C6C7]/70">Level Progress</span>
                <span className="text-sm font-medium text-white">72%</span>
              </div>
              <ProgressBar value={72} />
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-[#C5C6C7]/65">2,450 XP earned</span>
                <span className="text-[#45A29E]">Next milestone: 3,000 XP</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <SectionHeader title="Choose Your Game Mode" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <GameCard icon={Cpu} title="RAG Builder" description="Build retrieval flows with chunking, embeddings, and search." meta="AI Retrieval" />
          <GameCard icon={BrainCircuit} title="Agent Architect" description="Design multi-agent systems that coordinate like a real team." meta="Orchestration" />
          <GameCard icon={Rocket} title="System Design" description="Create scalable architectures for products like WhatsApp or Netflix." meta="Backend Systems" />
          <GameCard icon={Bug} title="Debug Challenge" description="Repair broken pipelines and uncover the component that caused failure." meta="Diagnostics" />
          <GameCard icon={Sparkles} title="Optimizer" description="Tune cost, speed, and reliability without breaking the experience." meta="Performance" />
        </div>
      </section>
    </div>
  );
}

function QuickStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0F151B] p-4">
      <p className="text-sm text-[#C5C6C7]/55">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Cube({ size = "md" }: { size?: "xs" | "sm" | "md" | "lg" | "xl" }) {
  const map = {
    xs: "h-12 w-12 rounded-2xl",
    sm: "h-16 w-16 rounded-2xl",
    md: "h-20 w-20 rounded-3xl",
    lg: "h-24 w-24 rounded-3xl",
    xl: "h-28 w-28 rounded-3xl",
  };

  return <div className={`${map[size]} border border-[#66FCF1]/20 bg-[#1d2834] shadow-[0_0_40px_rgba(102,252,241,0.1)]`} />;
}
