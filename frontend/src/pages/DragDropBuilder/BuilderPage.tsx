import { useParams } from "react-router-dom";
import { CanvasSimulationExperience } from "../../features/pipeline-canvas/CanvasSimulationExperience";
import type { GameModeId } from "../../features/pipeline-canvas/config";
import { challenges } from "../../data/challenges";

function modeForChallenge(challengeId?: string): GameModeId {
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];

  if (challenge.category === "RAG" || challenge.category === "Debug") {
    return "rag-builder";
  }

  if (challenge.category === "Agents") {
    return "agent-builder";
  }

  return "system-design-builder";
}

export function BuilderPage() {
  const { challengeId } = useParams();

  return <CanvasSimulationExperience initialModeId={modeForChallenge(challengeId)} />;
}
