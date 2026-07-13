import { RagRunResponse } from "../types";

const RUN_KEY = "engineerverse-rag-run";
const BUILD_KEY = "engineerverse-rag-build";

export function saveRagRun(run: RagRunResponse) {
  sessionStorage.setItem(RUN_KEY, JSON.stringify(run));
}

export function loadRagRun(): RagRunResponse | null {
  const raw = sessionStorage.getItem(RUN_KEY);
  return raw ? (JSON.parse(raw) as RagRunResponse) : null;
}

export function saveRagBuild(payload: unknown) {
  sessionStorage.setItem(BUILD_KEY, JSON.stringify(payload));
}

export function loadRagBuild<T>(): T | null {
  const raw = sessionStorage.getItem(BUILD_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}
