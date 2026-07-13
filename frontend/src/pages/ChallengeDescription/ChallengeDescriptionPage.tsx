import { ArrowLeft, Clock3, Loader2, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { challenges } from "../../data/challenges";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { fetchChallengeDetail } from "../../services/api";
import { ChallengeDetail } from "../../types";

export function ChallengeDescriptionPage() {
  const { challengeId } = useParams();
  const fallbackChallenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(fallbackChallenge.category === "RAG");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!challengeId || fallbackChallenge.category !== "RAG") return;
    setLoading(true);
    fetchChallengeDetail(challengeId)
      .then((data) => {
        setChallenge(data);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [challengeId, fallbackChallenge.category]);

  const resolvedChallenge =
    challenge ??
    ({
      ...fallbackChallenge,
      sampleQueries: [],
      scoringDimensions: [],
      validationRules: {
        requiredCore: [],
        optionalComponents: [],
        singlePipeline: true,
      },
    } satisfies ChallengeDetail);

  return (
    <div className="space-y-8">
      <Link
        to="/challenges"
        className="inline-flex items-center gap-2 text-sm text-[#C5C6C7]/70 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Challenges
      </Link>

      <Card>
        <CardContent className="space-y-6 p-8 md:p-10">
          {loading && (
            <div className="inline-flex items-center gap-2 text-sm text-[#C5C6C7]/70">
              <Loader2 className="h-4 w-4 animate-spin text-[#66FCF1]" />
              Loading challenge data...
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full border border-[#66FCF1]/16 bg-[#66FCF1]/10 px-3 py-1 text-[#66FCF1]">
              {resolvedChallenge.category}
            </span>
            <span className="rounded-full border border-white/6 bg-white/5 px-3 py-1 text-[#C5C6C7]/70">
              {resolvedChallenge.difficulty}
            </span>
            <span className="inline-flex items-center gap-2 text-[#C5C6C7]/70">
              <Clock3 className="h-4 w-4 text-[#45A29E]" />
              {resolvedChallenge.estimatedTime}
            </span>
            <span className="inline-flex items-center gap-2 text-[#C5C6C7]/70">
              <Star className="h-4 w-4 text-[#45A29E]" />
              {resolvedChallenge.rewardXp} XP
            </span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              {resolvedChallenge.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#C5C6C7]/65">
              {resolvedChallenge.summary}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-5 p-6">
            <h2 className="text-2xl font-semibold text-white">Mission Details</h2>
            <ul className="space-y-3 text-sm leading-6 text-[#C5C6C7]/70">
              {resolvedChallenge.objectives.map((item) => (
                <li key={item} className="rounded-2xl border border-white/5 bg-[#0F151B] px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">Supported Components</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {resolvedChallenge.supportedComponents.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/6 bg-white/5 px-3 py-2 text-sm text-[#C5C6C7]/80"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#66FCF1]/10 bg-[#0F151B] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#66FCF1]">
                <Sparkles className="h-4 w-4" />
                What you'll learn
              </div>
              <p className="text-sm leading-6 text-[#C5C6C7]/70">{resolvedChallenge.hint}</p>
            </div>

            {resolvedChallenge.sampleQueries.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-[#0F151B] p-4">
                <p className="mb-3 text-sm font-medium text-white">Sample queries</p>
                <div className="space-y-2">
                  {resolvedChallenge.sampleQueries.map((item) => (
                    <div key={item} className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm text-[#C5C6C7]/70">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={`/build/${resolvedChallenge.id}`}>Start Building</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/challenges">Back to Challenges</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
