# EngineerVerse RAG Mini-Game v1 Backend Plan

## Summary

Build the first workable mini-game around the existing `university-rag-001` challenge as a real, end-to-end RAG flow using a fixed bundled document set.

This v1 should let the player:

1. open the RAG challenge
2. build a pipeline with drag-and-drop nodes
3. submit the graph to the backend
4. get graph validation + score
5. run a real RAG execution against bundled handbook content
6. watch a backend-driven simulation timeline
7. land on a scored result with judge feedback

Chosen defaults:

- Real retrieval, not just simulation
- Bundled docs only for v1
- Single challenge first: `university-rag-001`
- One supported “correct” pipeline family with small optional bonuses

---

## Implementation Changes

### 1. Backend scope and architecture

Turn the backend into five RAG-specific subsystems:

- Challenge service: serves the challenge definition, allowed nodes, correct graph rules, and sample queries
- Validation service: checks submitted nodes/edges, order, required components, and optional bonus components
- Ingestion/index service: loads bundled handbook content, chunks it, embeds it, and builds/loads a local vector index
- Execution service: runs retrieval + answer generation for a chosen sample query
- Simulation/scoring service: converts execution + validation into a timeline, metrics, and judge feedback

For v1, keep everything synchronous from the frontend’s point of view. No job queue yet.

### 2. Bundled challenge content

Add one bundled RAG content pack in `content/challenges/rag/`:

- challenge definition JSON
- source document text or PDF
- sample user questions
- expected answer themes / acceptance hints
- correct node set and valid edge rules
- scoring weights

Recommended structure:

- `content/challenges/rag/university-rag-001.challenge.json`
- `content/challenges/rag/university-rag-001.source.txt` or `.pdf`
- `content/challenges/rag/university-rag-001.queries.json`

Prefer plain text for v1 unless you already need PDF parsing. That keeps ingestion simpler and faster.

### 3. Public backend APIs and payloads

Add these HTTP endpoints.

#### `GET /api/challenges/rag`
Returns all RAG challenges available in the library.

Response shape:

- `id`
- `title`
- `difficulty`
- `rewardXp`
- `estimatedTime`
- `summary`

#### `GET /api/challenges/{challengeId}`
Returns full challenge briefing for Description page.

Response adds:

- `objectives`
- `supportedComponents`
- `hint`
- `sampleQueries`
- `scoringDimensions`

#### `POST /api/build/validate`
Used by Builder page before simulation.

Request:

- `challengeId`
- `nodes: { id, type, label }[]`
- `edges: { source, target }[]`

Response:

- `isValid`
- `requiredMissingNodes`
- `invalidEdges`
- `detectedOrder`
- `scorePreview`
- `feedback`
- `normalizedPipeline`

`normalizedPipeline` should be the backend’s canonical ordered component list, because later execution and simulation should use backend-normalized data, not raw frontend ordering.

#### `POST /api/rag/run`
Runs the real RAG pipeline.

Request:

- `challengeId`
- `nodes`
- `edges`
- `query` (chosen from sample query list or typed manually later)
- optional `runMode` defaulting to `"scored"`

Response:

- `runId`
- `status`
- `answer`
- `retrievedChunks`
- `metrics`
- `simulationTimeline`
- `scoreBreakdown`
- `judgeFeedback`

`metrics` should minimally include:

- `latencyMs`
- `retrievedChunkCount`
- `topK`
- `contextChars`
- `estimatedCost` or a placeholder cost estimate

`simulationTimeline` should be directly consumable by the Simulation page.

#### `GET /api/runs/{runId}`
Optional for v1. Only add if you want refresh/reload resilience. Otherwise skip in first pass.

### 4. Backend schemas/types

Add backend schemas for:

- `ChallengeSummary`
- `ChallengeDetail`
- `BuildNode`
- `BuildEdge`
- `ValidateBuildRequest`
- `ValidateBuildResponse`
- `RagRunRequest`
- `RetrievedChunk`
- `SimulationEvent`
- `ScoreBreakdown`
- `JudgeFeedback`
- `RagRunResponse`

Frontend should mirror these in shared TS types later, but for v1 it is enough to manually align them.

### 5. Validation logic for the RAG game

For `university-rag-001`, support these core required components:

- `PDF Loader` or `Document Loader`
- `Chunking`
- `Embeddings`
- `Vector DB`
- `Retriever`
- `LLM`

Optional bonus components:

- `Reranker`
- `Prompt Template`

Validation rules:

- all required core nodes must exist
- graph must be connected as one pipeline
- embeddings must come before vector DB population / retriever usage
- retriever must precede LLM
- reranker, if present, must be between retriever and LLM
- prompt template, if present, must feed the LLM stage
- duplicate core nodes should be invalid in v1 unless explicitly allowed
- unsupported node types should hard-fail validation

Validation should return both blocking errors and non-blocking suggestions.

### 6. Real RAG execution design

For v1, use a very simple execution path:

- load bundled source text
- chunk it with fixed chunk size and overlap
- generate embeddings
- store embeddings in a local vector store
- retrieve top K chunks for the chosen query
- send retrieved context + query to the LLM
- return final answer plus supporting chunks

Keep the following fixed in v1 unless the challenge explicitly varies them:

- chunking strategy: recursive or fixed text split
- chunk size
- overlap
- embedding model
- top K
- prompt template

These should be backend constants for now, not player-controlled knobs.

Optimization gameplay can come later; this first game should prove the loop, not expose all tunables.

### 7. Simulation timeline contract

The Simulation page should not invent the flow. Backend should send timeline events like:

- `load_documents`
- `chunk_documents`
- `generate_embeddings`
- `index_vector_store`
- `receive_query`
- `retrieve_chunks`
- `optional_rerank`
- `compose_prompt`
- `generate_answer`
- `complete`

Each event should include:

- `id`
- `type`
- `label`
- `status`
- `startedAtOffsetMs`
- `durationMs`
- optional `meta`

Example `meta`:

- `chunkCount`
- `retrievedChunkCount`
- `query`
- `previewText`

This lets the frontend animate packet movement and show real metrics.

### 8. Scoring model for the first RAG game

Use one predictable score model:

- Architecture correctness: 40
- Retrieval readiness: 20
- Answer quality: 20
- Latency/performance: 10
- Best-practice bonus: 10

Scoring rules:

- invalid required graph => no run, return validation errors only
- valid graph but weak optional structure => run succeeds with lower score
- answer quality can be approximated in v1 by checking whether retrieved chunks contain expected answer keywords/themes
- do not try to do advanced LLM-as-judge grading yet; keep it deterministic

Judge feedback should always include:

- one positive observation
- one weakness
- one next improvement

### 9. Frontend changes needed for this backend

For the first workable game, the frontend needs these builder and simulation behaviors.

#### Builder page
Replace generic mock node labels with data from challenge detail endpoint.

Required interactions:

- show supported components from backend challenge definition
- let user place/connect nodes
- call `POST /api/build/validate`
- disable “Run Simulation” until graph is valid
- show blocking validation errors in the right panel
- use backend `normalizedPipeline` for submission

#### Query selection
Add a simple sample query selector on the Builder page or Description page.

For v1, use sample queries only. Do not add freeform user questions yet unless it’s effortless.

#### Simulation page
Render the backend timeline and metrics:

- active stage highlight
- stage log list
- retrieved chunk previews
- final answer reveal

#### Result page
Use backend score response, not hardcoded values.

### 10. Concrete execution order for the team

#### Step 1 — challenge contract
Define the single RAG challenge JSON and sample queries.

Deliverable:

- one finalized `university-rag-001` content pack

#### Step 2 — backend schemas and challenge loader
Implement challenge loading and the two read endpoints:

- `GET /api/challenges/rag`
- `GET /api/challenges/{challengeId}`

Deliverable:

- frontend can fetch real challenge data

#### Step 3 — validation engine
Implement `POST /api/build/validate` with canonical RAG graph rules.

Deliverable:

- builder can show real correctness feedback

#### Step 4 — ingestion and vector index
Implement source loading, chunking, embeddings, and vector index build/load.

Deliverable:

- backend can answer “ready to retrieve” for the bundled handbook

#### Step 5 — RAG run endpoint
Implement `POST /api/rag/run`.

Deliverable:

- backend returns answer, retrieved chunks, metrics, and simulation timeline

#### Step 6 — simulation/result wiring
Connect Simulation and Result pages to backend responses.

Deliverable:

- full loop works end-to-end for one challenge

#### Step 7 — polish
Add better judge feedback text, latency display, and error states.

---

## Test Plan

### API tests

- `GET /api/challenges/rag` returns at least `university-rag-001`
- `GET /api/challenges/university-rag-001` returns supported components and sample queries
- `POST /api/build/validate` rejects missing `Embeddings`
- `POST /api/build/validate` rejects wrong order like `Retriever -> Vector DB`
- `POST /api/build/validate` accepts the canonical correct flow
- `POST /api/rag/run` with valid pipeline returns non-empty answer and retrieved chunks
- `POST /api/rag/run` with invalid pipeline returns validation failure and does not execute

### End-to-end scenarios

- User opens RAG challenge, sees real components, builds correct graph, validates, runs, sees simulation, gets score
- User omits `Embeddings`, gets clear builder-side feedback, cannot run
- User adds `Reranker` in wrong place, gets non-ambiguous edge/order error
- User replays with another sample query and gets a different retrieved chunk set

### UI acceptance checks

- Builder page is driven by backend challenge data, not hardcoded labels
- Simulation page uses backend timeline events
- Result page uses backend score breakdown and judge feedback
- Daily challenge card can deep-link into the same RAG challenge flow

---

## Assumptions and Defaults

- First playable backend is for one challenge only: `university-rag-001`
- Document source is bundled, not uploaded
- Real retrieval is required for v1 demo quality
- Validation is deterministic and rule-based
- Answer scoring is deterministic and lightweight, not LLM-judge-heavy
- Builder remains single-pipeline only in v1
- React Flow integration is a separate frontend implementation step but should conform to the validation request shape above
- If PDF parsing adds friction, use plain text handbook content first and keep the displayed node label as `PDF Loader` for gameplay consistency
