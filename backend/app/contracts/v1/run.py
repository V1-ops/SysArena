from typing import Literal

from pydantic import BaseModel, Field

from .graph import GraphPayload


RunStatus = Literal["completed", "running", "failed"]


class ValidationIssue(BaseModel):
    code: str
    message: str
    nodeId: str | None = None
    edgeId: str | None = None


class ValidationResponse(BaseModel):
    challengeId: str
    isValid: bool
    issues: list[ValidationIssue] = Field(default_factory=list)
    feedback: list[str] = Field(default_factory=list)
    normalizedPipeline: list[str] = Field(default_factory=list)
    scorePreview: int = Field(default=0, ge=0, le=100)


class TraceEvent(BaseModel):
    id: str
    nodeId: str | None = None
    type: str
    status: str
    startedAtOffsetMs: int = Field(ge=0)
    durationMs: int = Field(default=0, ge=0)
    meta: dict[str, object] | None = None


class Score(BaseModel):
    overall: int = Field(ge=0, le=100)
    breakdown: dict[str, int] = Field(default_factory=dict)
    metrics: dict[str, float] = Field(default_factory=dict)


class Feedback(BaseModel):
    positive: str = ""
    weakness: str = ""
    nextStep: str = ""
    recommendations: list[str] = Field(default_factory=list)


class RunRequest(BaseModel):
    challengeId: str
    category: str | None = None
    playerId: str
    graph: GraphPayload
    input: dict[str, object] = Field(default_factory=dict)


class RunResponse(BaseModel):
    runId: str
    challengeId: str
    status: RunStatus
    score: Score | None = None
    trace: list[TraceEvent] = Field(default_factory=list)
    feedback: Feedback | None = None


class OptimizationRunRequest(BaseModel):
    challengeId: str = "optimizer-ann-001"
    playerId: str
    optimizers: list[str] = Field(default_factory=lambda: ["sgd", "momentum", "rmsprop", "adam"])
    epochs: int = Field(default=50, ge=1, le=500)
    seed: int = 0
    learningRate: float = Field(default=0.01, gt=0, le=1)


class LeaderboardEntry(BaseModel):
    playerId: str
    score: int = Field(ge=0, le=100)
    rank: int = Field(ge=1)
    completedAt: str | None = None


class LeaderboardResponse(BaseModel):
    challengeId: str
    entries: list[LeaderboardEntry] = Field(default_factory=list)
