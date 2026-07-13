from pydantic import BaseModel


class BuildNode(BaseModel):
    id: str
    type: str
    label: str


class BuildEdge(BaseModel):
    source: str
    target: str


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
