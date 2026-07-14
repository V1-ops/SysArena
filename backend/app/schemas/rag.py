from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.build import BuildEdge, BuildNode


class RagRunRequest(BaseModel):
    challengeId: str
    nodes: list[BuildNode]
    edges: list[BuildEdge]
    query: str = Field(min_length=1)
    runMode: str = "scored"


class RetrievedChunk(BaseModel):
    chunkId: str
    text: str
    score: float


class SimulationEvent(BaseModel):
    id: str
    type: str
    label: str
    status: Literal["completed", "degraded", "skipped", "failed"]
    startedAtOffsetMs: int
    durationMs: int
    nodeId: str | None = None
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
    chunkSize: int
    chunkOverlap: int
    rerankerUsed: bool
    executionMode: Literal["local", "external"]
    embeddingModel: str
    generationModel: str


class ExecutionDiagnostics(BaseModel):
    degradedNodeIds: list[str] = []
    skippedNodeIds: list[str] = []
    warnings: list[str] = []


class RagRunResponse(BaseModel):
    runId: str
    status: str
    answer: str
    retrievedChunks: list[RetrievedChunk]
    metrics: RagMetrics
    simulationTimeline: list[SimulationEvent]
    scoreBreakdown: list[ScoreBreakdown]
    judgeFeedback: JudgeFeedback
    pipelineValid: bool = True
    validationFeedback: list[str] = []
    executionDiagnostics: ExecutionDiagnostics = Field(default_factory=ExecutionDiagnostics)
