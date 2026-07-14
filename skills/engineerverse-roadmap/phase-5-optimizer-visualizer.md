# Phase 5 — ANN Optimizer Visualizer

## Goal

Create an educational optimizer lab that compares optimizer behavior over training epochs without using the architecture-building canvas.

## Backend work

- Replace the old `optimize-netflix-001` stub with `optimizer-ann-001`.
- Add a small fixed pretrained ANN and deterministic dataset.
- Start every selected optimizer from identical initial weights.
- Support SGD, Momentum, RMSprop, and Adam.
- Implement `POST /api/optimization/runs` with optimizer names, epoch count, seed, and controlled hyperparameters.
- Return epoch-by-epoch loss, accuracy, learning rate, and final comparison data.
- Exclude Optimization from competitive leaderboards in v1; it is an educational visualizer with completion history.

## Frontend work

- Add a dedicated optimizer route and page.
- Provide optimizer selection, epoch controls, learning-rate controls, pause, replay, reset, and series visibility toggles.
- Animate the returned epoch data progressively so users see the curves develop.
- Show convergence comparison, final metrics, and concise optimizer explanations.

## Acceptance criteria

- All optimizers start from identical initial conditions.
- The graph updates epoch-by-epoch and can be replayed deterministically.
- Different optimizer choices produce visibly distinct but valid curves.
