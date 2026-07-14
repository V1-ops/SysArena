# Phase 1 — RAG Visualizer Hardening

## Goal

Turn the current RAG implementation into a reproducible, configurable, and leaderboard-ready learning challenge.

## Backend work

- Keep the bundled Business Basics PDF as the reproducible v1 source.
- Make submitted node values affect execution:
  - chunk size
  - chunk overlap
  - embedding configuration
  - vector store selection
  - top-k
  - reranking
  - prompt template
  - supported model settings
- Cache PDF extraction, chunks, embeddings, and FAISS indexes when configuration is unchanged.
- Preserve deterministic local fallbacks when Hugging Face credentials are unavailable.
- Improve scoring across architecture correctness, retrieval readiness, grounded answer quality, latency, and best-practice components.
- Return trace events with stable `nodeId` values rather than relying on display-label matching.
- Persist completed RAG runs through the shared run service.

## Frontend work

- Use backend challenge details and sample queries in the builder.
- Use the bundled source for leaderboard runs.
- Remove the current misleading upload requirement, since the existing backend does not consume uploaded content.
- Migrate the submit flow to the shared run API while retaining a temporary legacy adapter.
- Drive node and edge animation directly from backend trace events.
- Render the result page from the persisted run response instead of session-only RAG state.

## Acceptance criteria

- A player can drag, connect, configure, validate, run, watch, score, and replay the RAG challenge.
- Supported configuration changes affect execution metrics or scoring where applicable.
- Repeating the same run with the same configuration produces comparable results.
