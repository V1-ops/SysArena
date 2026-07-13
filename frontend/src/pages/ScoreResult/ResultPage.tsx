import { ArrowRight, Home, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { challenges } from "../../data/challenges";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

const breakdown = [
  { label: "Architecture", score: 92 },
  { label: "Reliability", score: 95 },
  { label: "Latency", score: 84 },
  { label: "Cost", score: 78 },
];

export function ResultPage() {
  const { challengeId } = useParams();
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#66FCF1]/15 bg-[#66FCF1]/8 px-4 py-2 text-sm text-[#66FCF1]">
              <Sparkles className="h-4 w-4" />
              Challenge Complete
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-white">91 / 100</h1>
            <p className="text-lg text-[#45A29E]">Badge Unlocked: Messaging Architect</p>
            <p className="max-w-2xl text-base leading-7 text-[#C5C6C7]/65">
              Strong architecture overall. You balanced delivery reliability and speed well, with a clear service path.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-full border border-[#66FCF1]/15 bg-[radial-gradient(circle_at_top,rgba(102,252,241,0.18),transparent_40%),#10161d] shadow-[0_0_60px_rgba(102,252,241,0.12)]">
              <Trophy className="h-16 w-16 text-[#66FCF1]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-2xl font-semibold text-white">Breakdown</h2>
            {breakdown.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#C5C6C7]/70">{item.label}</span>
                  <span className="text-sm font-medium text-white">{item.score}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#10161d]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#45A29E_0%,#66FCF1_100%)]"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">AI Judge Feedback</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[#C5C6C7]/70">
                <p>✔ Strong use of queueing to protect message delivery under load.</p>
                <p>✖ Redis could be integrated more explicitly to reduce repeat read latency.</p>
                <p>➜ Next step: connect cache closer to the chat service for faster status lookups.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0F151B] p-4">
              <p className="text-sm font-medium text-white">Recommendations</p>
              <ul className="mt-3 space-y-2 text-sm text-[#C5C6C7]/65">
                <li>- Add cache</li>
                <li>- Improve ordering under burst load</li>
                <li>- Reduce cross-service dependency in hot paths</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={`/build/${challenge.id}`}>
                  <RotateCcw className="h-4 w-4" />
                  Replay
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/challenges">
                  <ArrowRight className="h-4 w-4" />
                  Next Challenge
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Back Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
