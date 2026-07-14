# Phase 4 — System Design Architecture Challenge

## Goal

Deliver a system-design game that evaluates architecture behavior under scale and failure instead of treating the graph as a simple linear pipeline.

## Challenge definition

Expand `design-whatsapp-001` with:

- scale assumptions for 100M users
- traffic, throughput, and latency targets
- required and optional infrastructure components
- normal, burst, and failure scenarios
- scoring weights for correctness, scale, resilience, latency, and cost

The initial core is Client, API Gateway, Chat Service, Queue, Database, and Notification Service. Cache, presence, and additional infrastructure are optional manifest-defined extensions.

## Backend work

- Support valid fan-out paths such as persistence plus notification delivery.
- Simulate normal delivery, burst traffic, queue buffering, degraded persistence, and notification failure.
- Return latency, throughput, reliability, delivery success, queue depth, and cost metrics.
- Score architecture validity, scalability, resilience, latency, and cost efficiency.

## Frontend work

- Replace the static WhatsApp simulation with a graph-driven request/packet animation.
- Add system-design scenario controls and a live metrics panel.
- Visualize queue buffering, persistence, notification delivery, and failure states.
- Preserve shared builder affordances while allowing system-specific branching.

## Acceptance criteria

- The canonical architecture delivers a message under normal load.
- Burst and failure scenarios visibly affect metrics and trace events.
- Multiple valid architectures can score differently without relying on one hardcoded node order.
