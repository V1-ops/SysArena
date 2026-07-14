const ACTIVE_CHALLENGE_KEY = "engineerverse-active-challenge";

export function setActiveChallenge(challengeId: string) {
  window.sessionStorage.setItem(ACTIVE_CHALLENGE_KEY, challengeId);
}

export function getActiveChallengeId() {
  return window.sessionStorage.getItem(ACTIVE_CHALLENGE_KEY);
}

export function clearActiveChallenge() {
  window.sessionStorage.removeItem(ACTIVE_CHALLENGE_KEY);
}
