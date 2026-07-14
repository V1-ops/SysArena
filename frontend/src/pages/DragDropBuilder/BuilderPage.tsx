import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CanvasSimulationExperience } from "../../features/pipeline-canvas/CanvasSimulationExperience";
import type { GameModeId } from "../../features/pipeline-canvas/config";
import { challenges } from "../../data/challenges";
import { fetchChallengeDetail } from "../../services/api";
import type { ChallengeDetail } from "../../types";
import { setActiveChallenge } from "../../lib/challenge-session";

function modeForChallenge(category?: string, challengeId?: string, gameModeId?: string): GameModeId {
  if (gameModeId === "rag-builder" || gameModeId === "agent-builder" || gameModeId === "system-design-builder") {
    return gameModeId;
  }
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];
  const effectiveCategory = category ?? challenge.category;

  if (effectiveCategory === "RAG" || effectiveCategory === "Debug") {
    return "rag-builder";
  }

  if (effectiveCategory === "Agents") {
    return "agent-builder";
  }

  return "system-design-builder";
}

export function BuilderPage() {
  const { challengeId } = useParams();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(challengeId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (challengeId) setActiveChallenge(challengeId);
  }, [challengeId]);

  useEffect(() => {
    if (!challengeId) {
      setLoading(false);
      return;
    }

    const currentChallengeId = challengeId;

    let cancelled = false;

    async function loadChallenge() {
      try {
        setLoading(true);
        setError(null);
        const detail = await fetchChallengeDetail(currentChallengeId);
        if (!cancelled) {
          setChallenge(detail);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load challenge.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadChallenge();

    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  if (loading) {
    return <div className="rounded-lg border border-white/8 bg-[#101820] p-6 text-sm text-[#C5C6C7]/75">Loading challenge builder...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-red-400/20 bg-red-950/30 p-6 text-sm text-red-100">{error}</div>;
  }

  return (
    <CanvasSimulationExperience
      key={challenge?.id ?? challengeId}
      initialModeId={modeForChallenge(challenge?.category, challengeId, challenge?.gameModeId)}
      challengeMetaOverride={
        challenge
          ? {
              challengeId: challenge.id,
              title: challenge.title,
              description: challenge.summary,
            }
          : undefined
      }
    />
  );
}
