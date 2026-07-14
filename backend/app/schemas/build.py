from typing import Any

from pydantic import BaseModel, Field


class BuildNode(BaseModel):
    id: str
    type: str
    label: str
    values: dict[str, Any] = Field(default_factory=dict)


class BuildEdge(BaseModel):
    source: str
    target: str
    sourceHandle: str | None = None
    targetHandle: str | None = None


class ValidateBuildRequest(BaseModel):
    challengeId: str
    nodes: list[BuildNode]
    edges: list[BuildEdge]


class InvalidEdge(BaseModel):
    source: str
    target: str
    reason: str


class ValidateBuildResponse(BaseModel):
    isValid: bool
    requiredMissingNodes: list[str]
    invalidEdges: list[InvalidEdge]
    detectedOrder: list[str]
    scorePreview: int
    feedback: list[str]
    normalizedPipeline: list[str]
