# Phase 6 — Cross-Category Product Integration

## Goal

Make the four challenge experiences feel like one coherent learning product rather than separate demos.

## Frontend work

- Show exactly one active challenge per category.
- Remove or hide Debug and the old Netflix optimization card from the v1 catalog.
- Make Challenge Description, Builder, Simulation, Result, Profile, and leaderboard views category-aware.
- Add consistent run status, error, retry, and empty states.
- Support keyboard-accessible alternatives for canvas interactions.
- Respect reduced-motion preferences.
- Ensure status is not communicated by color alone.

## Backend work

- Add stable category filters and challenge ordering.
- Add leaderboard pagination and deterministic tie-breaking.
- Add run metadata and error logging without storing sensitive documents or prompt contents.
- Return manifest/config versions with runs so historical results remain interpretable.

## Acceptance criteria

- A new player can discover any category, read the briefing, complete its interaction, see feedback, and return to the catalog without category-specific navigation bugs.
- The same player identity is used across runs in the browser.
- The four active challenges are visible and correctly routed.
