from pydantic import BaseModel

from app.schemas.build import BuildEdge, BuildNode


class RagRunRequest(BaseModel):
    challengeId: str
    nodes: list[BuildNode]
    edges: list[BuildEdge]
    query: str
    runMode: str = "scored"


class RetrievedChunk(BaseModel):
    chunkId: str
    text: str
    score: float


class SimulationEvent(BaseModel):
    id: str
    type: str
    label: str
    status: str
    startedAtOffsetMs: int
    durationMs: int
    meta: dict | None = None


class ScoreBreakdown(BaseModel):
    label: str
    score: int
    maxScore: int


class JudgeFeedback(BaseModel):
    positive: str
    weakness: str
    nextStep: str
    recommendations: list[str]


class RagMetrics(BaseModel):
    latencyMs: int
    retrievedChunkCount: int
    topK: int
    contextChars: int
    estimatedCost: str


class RagRunResponse(BaseModel):
    runId: str
    status: str
    answer: str
    retrievedChunks: list[RetrievedChunk]
    metrics: RagMetrics
    simulationTimeline: list[SimulationEvent]
    scoreBreakdown: list[ScoreBreakdown]
    judgeFeedback: JudgeFeedback
