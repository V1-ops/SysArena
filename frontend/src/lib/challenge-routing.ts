import type { Challenge } from "../types";
import { getActiveChallengeId } from "./challenge-session";

export function getChallengeStartPath(challenge: Pick<Challenge, "id" | "category"> & { surface?: string }) {
  if (challenge.id === "optimizer-gradient-001") return `/optimizer/${challenge.id}`;
  if (challenge.id === "physics-optimizer-001") return `/physics-optimizer/${challenge.id}`;
  return `/build/${challenge.id}`;
}

export function isChallengeActive(challengeId: string, pathname: string) {
  return pathname === `/build/${challengeId}` || pathname === `/optimizer/${challengeId}` || pathname === `/physics-optimizer/${challengeId}` || getActiveChallengeId() === challengeId;
}
