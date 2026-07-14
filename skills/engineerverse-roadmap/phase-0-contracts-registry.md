# Phase 0 — Contracts, Registry, and Baseline

## Goal

Establish the shared contracts and challenge registry that allow four different game types to use one platform without putting category-specific logic inside shared UI components.

## Backend work

- Add category-aware challenge manifest models and loader services.
- Add manifests for:
  - `university-rag-001`
  - `agent-coder-001`
  - `design-whatsapp-001`
  - `optimizer-ann-001`
- Move challenge definitions under `content/challenges/<category>/` as the backend source of truth.
- Extend graph schemas to preserve node values, positions, edge IDs, and source/target handles.
- Add shared validation, trace, run, score, feedback, and leaderboard schemas.
- Standardize run statuses as `completed`, `running`, and `failed`.
- Standardize scores to a normalized `0–100` range.

## Frontend work

- Add a canonical category union: `rag`, `agents`, `system-design`, and `optimization`.
- Replace duplicated local challenge metadata with API-backed data and an offline fallback.
- Keep `GameModeConfig` as the source for shared canvas rendering.
- Add a dedicated optimizer route separate from the drag-and-drop builder route.
- Generate and persist an anonymous `playerId` for v1 submissions.

## Target API contracts

- `GET /api/challenges?category=<category>`
- `GET /api/challenges/{challengeId}`
- `GET /api/challenges/{challengeId}/config`
- `POST /api/runs/validate`
- `POST /api/runs`
- `GET /api/runs/{runId}`
- `GET /api/leaderboards/{challengeId}`
- `POST /api/optimization/runs`

Keep the existing RAG endpoints as compatibility wrappers until the generic routes are proven.

## Acceptance criteria

- All four challenge manifests load successfully.
- The frontend can list and open every v1 challenge.
- A graph payload round-trips without losing configuration values or handles.
- Existing RAG endpoints continue to work during migration.
