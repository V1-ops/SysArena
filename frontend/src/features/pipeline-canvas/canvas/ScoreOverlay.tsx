import { Activity, Trophy } from "lucide-react";
import { useGraphStore } from "../hooks/useGraphStore";

interface ScoreOverlayProps {
  embedded?: boolean;
}

export function ScoreOverlay({ embedded = false }: ScoreOverlayProps) {
  const runState = useGraphStore((state) => state.runState);
  const response = useGraphStore((state) => state.lastResponse);

  return (
    <section className={embedded ? "space-y-3" : "rounded-lg border border-white/8 bg-[#101820] p-4"}>
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-[#66FCF1]" />
        <p className="text-sm font-semibold text-white">Run Status</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/8 bg-[#0B0C10] p-3">
          <p className="text-xs text-[#C5C6C7]/55">State</p>
          <p className="mt-1 text-sm font-medium capitalize text-white">{runState}</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-[#0B0C10] p-3">
          <p className="text-xs text-[#C5C6C7]/55">Score</p>
          <p className="mt-1 text-sm font-medium text-white">
            {response ? `${Math.round(response.score.overall * 100)}%` : "--"}
          </p>
        </div>
      </div>

      {response && (
        <div className="mt-4 rounded-lg border border-[#66FCF1]/10 bg-[#0B0C10] p-3">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#66FCF1]" />
            <p className="text-sm text-white">
              {response.leaderboardRank > 0 ? `Rank #${response.leaderboardRank}` : "Score recorded"}
            </p>
          </div>
          <div className="space-y-2">
            {Object.entries(response.score.metrics).map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs text-[#C5C6C7]/65">
                  <span>{label}</span>
                  <span>{Math.round(value * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#1F2833]">
                  <div className="h-full rounded-full bg-[#66FCF1]" style={{ width: `${value * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
