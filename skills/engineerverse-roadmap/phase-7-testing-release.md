# Phase 7 — Testing, Observability, and Release

## Goal

Verify every category end-to-end and make the product safe to demonstrate and extend.

## Backend tests

- Challenge manifest loading for all four categories.
- Graph validation for valid, disconnected, cyclic, duplicate, missing-node, invalid-handle, and invalid-data-type submissions.
- RAG scoring, caching, parameter influence, and deterministic fallback behavior.
- Agent fixture execution, retries, missing verification, and transcript generation.
- System-design normal, burst, and failure scenarios.
- Optimizer reproducibility, epoch ordering, optimizer comparison, and response schema.
- API contracts, run persistence, refresh/reload, leaderboard ordering, and error responses.

## Frontend tests

- Config-driven palette and node rendering.
- Connection validation and graph serialization.
- Shared run-store state transitions.
- Trace playback, active node/edge state, retry, and failed-run states.
- Category routing and optimizer-specific rendering.
- Result and leaderboard rendering from backend responses.

## End-to-end checks

- Complete one successful run for each category.
- Verify invalid graphs produce useful feedback.
- Verify browser refresh reloads a completed run.
- Verify higher scores change leaderboard ordering.
- Verify the production frontend build in CI, because local Vite execution is currently blocked by sandbox `spawn EPERM`.

## Observability

Log run ID, challenge ID, category, seed, duration, score, and failure reason. Do not log sensitive document or prompt contents.

## Release checklist

- Frontend production build passes.
- Backend starts and `/health` responds.
- All four challenge manifests are available.
- No non-RAG path depends on fabricated score or rank data.
- Demo mode is explicit and cannot pollute leaderboard data.
- Local setup and challenge-authoring instructions are documented.

## V1 boundaries

- No authentication or multiplayer collaboration.
- No arbitrary user-uploaded RAG corpus for leaderboard runs.
- No live external agent tools or model calls for scored runs.
- No anti-cheat controls yet.
- No user-created challenges yet.
