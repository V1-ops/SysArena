# EngineerVerse Implementation Phases

This folder contains the end-to-end implementation roadmap for EngineerVerse. Each phase has its own Markdown file so it can be assigned, reviewed, and implemented independently.

## Current codebase baseline

- The frontend already has React, TypeScript, React Flow, Zustand, routing, and a reusable config-driven canvas.
- RAG is the only category with a real backend execution path, including FAISS retrieval, scoring, and simulation traces.
- Agents and System Design currently have frontend canvas configurations but use fake/local submission behavior.
- The Simulation page is still a static showcase, and leaderboard data is placeholder-based.
- Optimization currently exists only as a frontend stub.
- `npx tsc -b --pretty false` and backend `compileall` pass; Vite production build is currently blocked by sandbox `spawn EPERM`.

## Phase files

1. [Phase 0 — Contracts, Registry, and Baseline](phase-0-contracts-registry.md)
2. [Phase 1 — RAG Visualizer Hardening](phase-1-rag-hardening.md)
3. [Phase 2 — Shared Execution, Persistence, and Leaderboards](phase-2-shared-platform.md)
4. [Phase 3 — Agentic Workflow Challenge](phase-3-agentic-workflow.md)
5. [Phase 4 — System Design Architecture Challenge](phase-4-system-design.md)
6. [Phase 5 — ANN Optimizer Visualizer](phase-5-optimizer-visualizer.md)
7. [Phase 6 — Cross-Category Product Integration](phase-6-product-integration.md)
8. [Phase 7 — Testing, Observability, and Release](phase-7-testing-release.md)

## V1 challenge set

- RAG: `university-rag-001`
- Agents: `agent-coder-001`
- System Design: `design-whatsapp-001`
- Optimization: `optimizer-ann-001`

Delivery is sequential: RAG hardening, shared platform, Agents, System Design, then Optimization.
