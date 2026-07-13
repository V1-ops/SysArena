import {
  BuildEdge,
  BuildNode,
  ChallengeDetail,
  ChallengeSummary,
  RagRunResponse,
  ValidateBuildResponse,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = typeof data?.detail === "string" ? data.detail : data?.detail?.message ?? message;
    } catch {
      // keep fallback
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchRagChallenges() {
  return request<ChallengeSummary[]>("/challenges/rag");
}

export function fetchChallengeDetail(challengeId: string) {
  return request<ChallengeDetail>(`/challenges/${challengeId}`);
}

export function validateBuild(challengeId: string, nodes: BuildNode[], edges: BuildEdge[]) {
  return request<ValidateBuildResponse>("/build/validate", {
    method: "POST",
    body: JSON.stringify({ challengeId, nodes, edges }),
  });
}

export function runRagChallenge(
  challengeId: string,
  nodes: BuildNode[],
  edges: BuildEdge[],
  query: string
) {
  return request<RagRunResponse>("/rag/run", {
    method: "POST",
    body: JSON.stringify({ challengeId, nodes, edges, query, runMode: "scored" }),
  });
}
