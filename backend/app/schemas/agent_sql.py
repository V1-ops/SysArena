from pydantic import BaseModel, ConfigDict, Field

from app.schemas.build import BuildEdge, BuildNode


class AgentInput(BaseModel):
    datasetId: str | None = None
    documentName: str | None = None
    documentText: str | None = None
    schemaHint: str | None = None
    query: str


class AgentRunRequest(BaseModel):
    challengeId: str
    nodes: list[BuildNode]
    edges: list[BuildEdge]
    input: AgentInput
    runMode: str = "scored"


class AgentChart(BaseModel):
    type: str
    title: str
    xKey: str | None = None
    yKey: str | None = None


class AgentResult(BaseModel):
    columns: list[str]
    rows: list[dict[str, object]]


class AgentMetrics(BaseModel):
    latencyMs: int
    retryCount: int
    rowCount: int
    estimatedCost: str


class AgentRunResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    runId: str
    status: str
    dataset: dict
    answer: str
    sql: str
    schemaInfo: list[dict[str, str]] = Field(alias="schema")
    result: AgentResult
    chart: AgentChart
    simulationTimeline: list[dict]
    transcript: list[dict]
    metrics: AgentMetrics
    scoreBreakdown: list[dict]
    judgeFeedback: dict
    planArtifact: dict
    researchArtifact: dict
    sqlArtifact: dict
    verificationArtifact: dict
    reviewArtifact: dict
