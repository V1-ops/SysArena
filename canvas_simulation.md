# AGENTS.md — Canvas & Simulation Module (Pipeline Arena)

> Scope: this file governs ONLY the Canvas & Simulation Lead's portion of the build —
> the drag-and-drop pipeline builder, node system, canvas UX, and its contract with
> the backend. It assumes a config-driven architecture so the same canvas can power
> multiple game modes (RAG builder, Agent builder, System Design builder, etc.)
> without code changes — only config changes.

---

## 1. Purpose

Build an interactive, node-based canvas where a user assembles a pipeline (RAG,
agent tool-chain, or other workflow type depending on game mode) by dragging nodes
from a palette, connecting them, configuring their parameters, and submitting the
resulting graph to the backend for scoring.

The canvas itself must contain **zero hardcoded domain logic** (no "if RAG mode do X").
All domain-specific behavior — which nodes exist, what they look like, how they connect,
what fields they expose — comes from a config object loaded at runtime. This is what
makes the build "dynamic" and reusable across game modes.

---

## 2. Tech Stack (Canvas & Simulation scope only)

| Item | Tool | Notes |
|---|---|---|
| Framework | React + TypeScript | Strict typing on node/edge data recommended |
| Canvas engine | React Flow (`@xyflow/react`) | Core drag/drop/connect/zoom/pan engine |
| State management | Zustand | Store: nodes, edges, active config, active game mode, selected node |
| Styling | Tailwind CSS + CSS variables for theme tokens | Theme tokens come from config, not hardcoded classes |
| Layout assist (optional) | `dagre` or `elkjs` | Auto-arrange nodes if graphs get messy during a run |
| Data fetching | `fetch` or `axios` to FastAPI backend | POST graph, GET challenge/config |
| Real-time | native WebSocket or `socket.io-client` | Subscribe to score/leaderboard updates after submit |
| Serialization | React Flow's built-in `toObject()` / `getNodes()` / `getEdges()` | Base for the JSON payload sent to backend |

---

## 3. Core Architectural Principle: Config Drives Everything

Nothing about a specific game mode should be written into component code. Instead:

```
gameModeConfig (loaded per challenge/session)
   ├── theme               → visual tokens
   ├── nodeRegistry[]       → available node types, their fields, handles
   ├── connectionRules      → what can connect to what
   ├── canvasSettings       → grid, zoom, snapping, animation speed
   └── challengeMeta        → title, description, constraints, allowed node subset
```

One generic `<PipelineCanvas config={gameModeConfig} />` component renders correctly
for ANY game mode, because it never hardcodes node types — it maps over
`config.nodeRegistry` to build `nodeTypes` for React Flow, and reads
`config.connectionRules` inside `isValidConnection`.

**Switching game modes = swapping the config object. No component rewrites.**

---

## 4. Config Schema (source of truth)

```ts
interface GameModeConfig {
  id: string;                     // e.g. "rag-builder", "agent-builder"
  label: string;

  theme: {
    background: string;
    gridColor: string;
    nodeColors: Record<string, string>;   // category -> color
    accent: string;
    textPrimary: string;
    textSecondary: string;
    borderRadius: string;
    edgeColor: string;
    edgeAnimatedColor: string;
  };

  nodeRegistry: NodeTypeDef[];

  connectionRules: {
    // category -> array of categories it's allowed to connect INTO
    [sourceCategory: string]: string[];
  };

  canvasSettings: {
    gridSize: number;
    snapToGrid: boolean;
    minZoom: number;
    maxZoom: number;
    edgeAnimationSpeed: number;   // ms per animation cycle
    defaultNodeSpacing: number;
  };

  challengeMeta: {
    challengeId: string;
    title: string;
    description: string;
    allowedNodeTypeIds: string[];   // subset restriction for difficulty control
    maxNodes?: number;
    timeLimitSeconds?: number;
  };
}

interface NodeTypeDef {
  id: string;               // "chunker", "embedder", "retriever", "reranker", "llm_call", ...
  label: string;
  category: string;         // "ingestion" | "retrieval" | "generation" | "tool" | ... (mode-dependent)
  description: string;
  icon?: string;
  inputs: HandleDef[];
  outputs: HandleDef[];
  configFields: ConfigFieldDef[];
}

interface HandleDef {
  id: string;
  label: string;
  dataType: string;   // used for type-matching validation, e.g. "chunks", "vectors", "text"
}

interface ConfigFieldDef {
  name: string;
  label: string;
  type: "select" | "slider" | "text" | "number" | "toggle";
  options?: string[];       // for select
  min?: number; max?: number; step?: number;  // for slider/number
  default: unknown;
}
```

### Example: RAG Builder mode config (abbreviated)

```json
{
  "id": "rag-builder",
  "label": "RAG Pipeline Builder",
  "theme": {
    "background": "#0b0d12",
    "gridColor": "#1a1d24",
    "nodeColors": {
      "ingestion": "#3b82f6",
      "retrieval": "#a855f7",
      "generation": "#f97316"
    },
    "accent": "#22d3ee",
    "textPrimary": "#f4f4f5",
    "textSecondary": "#9ca3af",
    "borderRadius": "12px",
    "edgeColor": "#3f3f46",
    "edgeAnimatedColor": "#22d3ee"
  },
  "nodeRegistry": [
    {
      "id": "chunker",
      "label": "Chunker",
      "category": "ingestion",
      "description": "Splits documents into chunks",
      "inputs": [],
      "outputs": [{ "id": "out", "label": "Chunks", "dataType": "chunks" }],
      "configFields": [
        { "name": "chunkSize", "label": "Chunk Size", "type": "slider", "min": 100, "max": 1000, "step": 50, "default": 300 }
      ]
    },
    {
      "id": "embedder",
      "label": "Embedder",
      "category": "ingestion",
      "description": "Converts chunks to vectors",
      "inputs": [{ "id": "in", "label": "Chunks", "dataType": "chunks" }],
      "outputs": [{ "id": "out", "label": "Vectors", "dataType": "vectors" }],
      "configFields": [
        { "name": "model", "label": "Embedding Model", "type": "select", "options": ["MiniLM-L6", "OpenAI-ada-002"], "default": "MiniLM-L6" }
      ]
    }
  ],
  "connectionRules": {
    "ingestion": ["retrieval"],
    "retrieval": ["generation"]
  },
  "canvasSettings": {
    "gridSize": 20,
    "snapToGrid": true,
    "minZoom": 0.4,
    "maxZoom": 1.5,
    "edgeAnimationSpeed": 1200,
    "defaultNodeSpacing": 180
  },
  "challengeMeta": {
    "challengeId": "medical-qa-basic",
    "title": "Medical Q&A Retrieval Challenge",
    "description": "Build a pipeline that retrieves accurate context for clinical questions.",
    "allowedNodeTypeIds": ["chunker", "embedder", "retriever", "reranker", "llm_call"]
  }
}
```

Adding a second game mode (e.g. `agent-builder`) is a **new JSON file**, not new components:
different `nodeRegistry` (tools instead of retrieval steps), different `connectionRules`,
different color palette. The canvas code does not change.

---

## 5. Component Architecture

```
<PipelineCanvasProvider config={activeGameModeConfig}>
  <NodePalette />               // reads config.nodeRegistry, filtered by challengeMeta.allowedNodeTypeIds
  <PipelineCanvas />            // wraps <ReactFlow>, uses generic <ConfigurableNode>
    <ConfigurableNode />        // ONE component, renders per node.data + config.theme
  <SubmitPanel />               // serialize + POST + show submission status
  <ScoreOverlay />              // subscribes to WebSocket, shows live/final score
</PipelineCanvasProvider>
```

### `<ConfigurableNode>` (the single most important component)
- Reads `data.nodeTypeId`, looks up the matching `NodeTypeDef` from config.
- Renders label, category color (from `theme.nodeColors[category]`), icon.
- Renders `<Handle>` for each entry in `inputs`/`outputs`, labeled and color-coded by `dataType`.
- Renders inline config fields (select/slider/text/toggle) directly from `configFields`,
  writing changes back into `node.data.values`.
- **Never** contains a switch statement over specific node IDs. If you find yourself writing
  `if (nodeId === 'embedder')` inside this component, stop — that logic belongs in config.

### `<NodePalette>`
- Sidebar list of draggable node "cards," one per entry in the active
  `config.nodeRegistry` (filtered to `challengeMeta.allowedNodeTypeIds`).
- Standard React Flow drag-from-sidebar pattern: `onDragStart` sets `dataTransfer`,
  canvas `onDrop` reads it and calls `addNodes`.

### Connection validation
```ts
function isValidConnection(connection, nodes, config) {
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);
  const sourceCategory = getNodeDef(sourceNode, config).category;
  const targetCategory = getNodeDef(targetNode, config).category;
  const allowed = config.connectionRules[sourceCategory] ?? [];
  return allowed.includes(targetCategory);
}
```
Also validate `dataType` match between the specific output handle and input handle,
not just category — prevents "Chunks" plugging into a "Vectors" input even if both
nodes are technically adjacent categories.

---

## 6. Simulation / Live Animation Layer

Purpose: visually show "data flowing" through the pipeline during a run, for demo impact.

- On submit, backend returns either a final score OR a step-by-step execution trace
  (array of `{ nodeId, status, timestampMs }`).
- Canvas iterates the trace and sequentially:
  - highlights the active node (`data.status = "running"` → border pulse via config's `accent` color)
  - animates the corresponding edge (`animated: true` React Flow edge prop, speed from
    `canvasSettings.edgeAnimationSpeed`)
  - on completion, marks node `data.status = "success" | "error"` with a colored badge
- If backend can't provide a real step trace in time, **fake it client-side** with a fixed
  delay per node in submission order — visually indistinguishable to judges, much less
  backend work. Flag this as an acceptable shortcut for the hackathon.

---

## 7. Backend Contract (Canvas ↔ FastAPI)

### Submit pipeline
```
POST /api/submit
{
  "gameModeId": "rag-builder",
  "challengeId": "medical-qa-basic",
  "userId": "string",
  "graph": {
    "nodes": [
      { "id": "n1", "type": "chunker", "data": { "values": { "chunkSize": 300 } }, "position": {...} },
      ...
    ],
    "edges": [
      { "id": "e1", "source": "n1", "sourceHandle": "out", "target": "n2", "targetHandle": "in" }
    ]
  }
}
```

### Response (sync) or WebSocket push (async)
```
{
  "submissionId": "string",
  "status": "completed" | "running" | "failed",
  "score": { "overall": 0.82, "metrics": { "faithfulness": 0.9, "contextPrecision": 0.75 } },
  "trace": [ { "nodeId": "n1", "status": "success", "timestampMs": 120 }, ... ],
  "leaderboardRank": 3
}
```

### WebSocket (leaderboard/live updates)
```
ws://.../ws/leaderboard/{challengeId}
→ pushes: { "userId": "...", "score": 0.82, "rank": 3 } on every new/updated submission
```

Agree on this contract with the Backend Lead **before** writing serialization code —
this is the single most common source of last-hour integration breakage.

---

## 8. Build Order (recommended sequence)

1. **Bare canvas** — `<ReactFlow>` with 2-3 hardcoded dummy nodes, confirm pan/zoom/drag works.
2. **Config loader** — load one hardcoded `GameModeConfig` object (RAG mode), no dynamic switching yet.
3. **`<ConfigurableNode>`** — single generic component driven entirely by config + node data.
4. **`<NodePalette>`** — drag-from-sidebar using `config.nodeRegistry`.
5. **Connection validation** — `isValidConnection` using `connectionRules` + handle `dataType`.
6. **Config field editing** — inline node config panel writing into `node.data.values`.
7. **Serialize + submit** — `toObject()` → clean payload → POST to backend contract above.
8. **WebSocket subscription** — score/leaderboard live updates.
9. **Simulation animation layer** — node highlight + edge animation from trace (or faked delays).
10. **Theme polish + second game mode config** — only after step 7 works end-to-end. Adding
    a second config file here is your proof that the "dynamic, multi-mode" claim is real —
    do this even if only for the demo, it's a strong judge-facing moment ("watch me switch
    game modes with one config swap").

**Do not start on step 9 or 10 before step 7 works.** A gorgeous non-functional canvas loses
to an ugly functional one every time in judging.

---

## 9. File Structure (suggested)

```
/src
  /canvas
    PipelineCanvas.tsx
    ConfigurableNode.tsx
    NodePalette.tsx
    SubmitPanel.tsx
    ScoreOverlay.tsx
    hooks/
      useGraphStore.ts        (Zustand store: nodes, edges, actions)
      useGameModeConfig.ts    (loads/switches active config)
      useSimulationTrace.ts   (drives node/edge animation from trace)
    validation/
      isValidConnection.ts
  /config
    rag-builder.config.json
    agent-builder.config.json   (stretch goal / demo flex)
  /types
    config.types.ts            (interfaces from Section 4)
    graph.types.ts
```

---

## 10. Non-Negotiables / Guardrails

- No node-type-specific logic inside components — everything routes through config.
- No blocking network calls inside render — submissions and WebSocket handling live in
  hooks/effects, not inline in JSX.
- Every node MUST have a fallback visual state if a config field is missing (don't crash
  the canvas because one config entry is incomplete mid-hackathon).
- Keep a **hardcoded fallback config + fake score response** ready at all times so the
  canvas can be demoed even if the backend is down — critical for live demo safety.
- Snap-to-grid ON by default — messy free-floating graphs look unpolished on stage.

---

## 11. Definition of Done (for this module, hackathon scope)

- [ ] User can drag nodes from palette onto canvas
- [ ] User can connect nodes, invalid connections are visually rejected
- [ ] User can edit node config fields inline
- [ ] Graph serializes to the agreed JSON contract
- [ ] Submit button POSTs graph and receives a score
- [ ] Score/leaderboard updates live via WebSocket
- [ ] At least one full simulation animation run (real or faked) plays on submit
- [ ] A second game mode config file exists, proving the config-driven claim, even if
      not fully wired to a second backend flow
