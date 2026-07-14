import type { Challenge } from "../types";
import { getActiveChallengeId } from "./challenge-session";

export function getChallengeStartPath(challenge: Pick<Challenge, "id" | "category"> & { surface?: string }) {
  return `/build/${challenge.id}`;
}

export function isChallengeActive(challengeId: string, pathname: string) {
  return pathname === `/build/${challengeId}` || getActiveChallengeId() === challengeId;
}
