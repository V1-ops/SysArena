import { Award, Flame, Star, Trophy } from "lucide-react";
import { playerProfile } from "../../data/challenges";
import { PageHeader } from "../../components/common/PageHeader";
import { Card, CardContent } from "../../components/ui/card";
import { ProgressBar } from "../../components/common/ProgressBar";

const badges = ["Retrieval Rookie", "Messaging Architect", "Latency Hunter", "System Tactician"];
const activity = [
  "Scored 91 on Design WhatsApp for 100M users",
  "Unlocked Messaging Architect badge",
  "Completed 7-day streak milestone",
];

export function ProfilePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Player Profile"
        title={playerProfile.name}
        description="Your identity hub for progression, achievements, and performance across the arcade."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[#66FCF1]/18 bg-[#101820] text-2xl font-semibold text-[#66FCF1]">
                A
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{playerProfile.name}</p>
                <p className="text-sm text-[#45A29E]">{playerProfile.rank}</p>
                <p className="mt-1 text-sm text-[#C5C6C7]/65">{playerProfile.totalXp} total XP</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-[#C5C6C7]/70">Level {playerProfile.level}</span>
                <span className="text-white">72%</span>
              </div>
              <ProgressBar value={72} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileStat icon={Trophy} label="Average Score" value="89" />
          <ProfileStat icon={Flame} label="Current Streak" value={`${playerProfile.streakDays} days`} />
          <ProfileStat icon={Star} label="Challenges Completed" value="28" />
          <ProfileStat icon={Award} label="Replay Count" value="14" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-2xl font-semibold text-white">Achievements</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {badges.map((badge) => (
                <div key={badge} className="rounded-2xl border border-white/5 bg-[#0F151B] p-4">
                  <p className="font-medium text-white">{badge}</p>
                  <p className="mt-2 text-sm text-[#C5C6C7]/65">Unlocked through strong gameplay and replay consistency.</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item} className="rounded-2xl border border-white/5 bg-[#0F151B] px-4 py-3 text-sm text-[#C5C6C7]/70">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-[#66FCF1]" />
        <p className="mt-4 text-sm text-[#C5C6C7]/65">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
