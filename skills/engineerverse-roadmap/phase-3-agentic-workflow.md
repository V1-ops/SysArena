# Phase 3 — Agentic Workflow Challenge

## Goal

Deliver the first real agentic workflow game using the shared canvas and a deterministic simulation engine.

## Challenge definition

Complete `agent-coder-001` with:

- mission brief
- expected workflow behavior
- allowed node types
- graph constraints
- scoring dimensions
- sample execution scenario

Use the existing Planner, Researcher, Coder, Tester, and Reviewer nodes as the v1 core. Add branching or tool nodes only when required by the challenge manifest.

## Backend work

- Implement fixture-based deterministic execution.
- Do not depend on external LLMs or live tools for leaderboard runs.
- Simulate planning, research/tool actions, code generation, testing, review, retries, and final delivery.
- Validate ordering, missing verification, invalid data flow, unnecessary hops, and disconnected branches.
- Score orchestration quality, correctness, verification coverage, efficiency, and final output quality.
- Return a transcript, node-level trace events, step count, retries, latency, and estimated cost.

## Frontend work

- Reuse the generic canvas and configuration-driven nodes.
- Add agent-specific input fields and controls without putting agent logic into shared components.
- Render an agent simulation transcript beside the animated graph.
- Show active agent, action, verification, retry, and delivery states.

## Acceptance criteria

- The canonical workflow runs from Planner through Reviewer.
- Invalid or unverified workflows receive useful corrective feedback.
- The player can understand each agent’s work while the graph animates.
