# Phase 2 — Shared Execution, Persistence, and Leaderboards

## Goal

Create the common backend and frontend run lifecycle required by all scored challenge categories.

## Backend work

- Introduce category execution adapters:
  - `RagRunEngine`
  - `AgentRunEngine`
  - `SystemDesignRunEngine`
  - `OptimizerRunEngine`
- Generalize graph validation for:
  - linear pipelines
  - DAGs
  - branches and joins
  - required and optional nodes
  - cycles
  - duplicate nodes
  - invalid handles and data types
- Add SQLite persistence for runs, scores, player IDs, and leaderboard rows.
- Store challenge ID, category, manifest version, seed, duration, status, score, metrics, and serialized result.
- Replace fabricated ranks with persisted ordering and deterministic tie-breaking.

## Frontend work

- Add a shared run store containing challenge, graph, run ID, status, trace, result, score, feedback, and leaderboard data.
- Make Simulation and Result generic shells with category-specific renderers.
- Make run state survive navigation and browser refresh.
- Keep local fake responses behind an explicit development flag only; demo results must never enter leaderboards.
- Add loading, retry, timeout, invalid-graph, backend-unavailable, and empty-leaderboard states.

## Acceptance criteria

- A completed run survives navigation and refresh.
- Scores and ranks come from backend persistence.
- A run can be reloaded using its run ID.
- RAG works completely through the shared execution path.
