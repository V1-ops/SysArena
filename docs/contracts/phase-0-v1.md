# EngineerVerse Phase 0 v1 Contract

This document is the handoff boundary between the independently developed phases.

## Canonical categories

`rag`, `agents`, `system-design`, and `optimization`.

## Canonical challenges

- `university-rag-001`
- `agent-coder-001`
- `design-whatsapp-001`
- `optimizer-ann-001`

## Graph invariants

Every graph node carries `id`, `type`, `values`, and `position`. Every edge carries `id`, `source`, `target`, `sourceHandle`, and `targetHandle`. Handles may be `null`.

## Run invariants

Run statuses are `completed`, `running`, or `failed`. Scores are integers from `0` through `100`.

Phase 0 exposes the generic run and optimization routes as safe typed stubs. Phase 2 and Phase 5 replace their implementations without changing the route names or the v1 graph/status/score fields.

## Compatibility

`/api/challenges/rag`, `/api/build/validate`, and `/api/rag/run` remain available while category execution migrates to the generic contracts.
