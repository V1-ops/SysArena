from pydantic import BaseModel, Field


class Position(BaseModel):
    x: float
    y: float


class GraphNode(BaseModel):
    id: str
    type: str
    label: str | None = None
    values: dict[str, object] = Field(default_factory=dict)
    position: Position = Field(default_factory=lambda: Position(x=0, y=0))


class GraphEdge(BaseModel):
    id: str
    source: str
    sourceHandle: str | None = None
    target: str
    targetHandle: str | None = None


class GraphPayload(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)
