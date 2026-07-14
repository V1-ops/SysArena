import { Clock3, Star } from "lucide-react";

export function ChallengeMetadata({ difficulty, estimatedTime, rewardXp }: { difficulty: string; estimatedTime: string; rewardXp: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-[#C5C6C7]/60">
      <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1">{difficulty}</span>
      <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-[#45A29E]" />{estimatedTime}</span>
      <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-[#45A29E]" />{rewardXp} XP</span>
    </div>
  );
}
