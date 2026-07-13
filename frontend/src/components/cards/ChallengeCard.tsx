import { Link } from "react-router-dom";
import { Clock3, Star } from "lucide-react";
import { Challenge } from "../../types";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <Card className="group transition-all duration-200 hover:-translate-y-1 hover:border-[#66FCF1]/15">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-full border border-[#66FCF1]/16 bg-[#66FCF1]/10 px-3 py-1 text-[#66FCF1]">
            {challenge.category}
          </span>
          <span className="rounded-full border border-white/6 bg-white/5 px-3 py-1 text-[#C5C6C7]/70">
            {challenge.difficulty}
          </span>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white">{challenge.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#C5C6C7]/65">
            {challenge.summary}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-[#C5C6C7]/70">
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[#45A29E]" />
            {challenge.estimatedTime}
          </span>
          <span className="inline-flex items-center gap-2">
            <Star className="h-4 w-4 text-[#45A29E]" />
            {challenge.rewardXp} XP
          </span>
        </div>

        <div className="mt-auto">
          <Button asChild>
            <Link to={`/challenge/${challenge.id}`}>Start</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
