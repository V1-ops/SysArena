from typing import Literal

from pydantic import BaseModel, Field


ChallengeCategory = Literal["rag", "agents", "system-design", "optimization"]
ChallengeSurface = Literal["builder", "optimizer"]


class ScoringDimension(BaseModel):
    label: str
    weight: int = Field(ge=0, le=100)


class ChallengeManifest(BaseModel):
    manifestVersion: int = 1
    id: str
    category: ChallengeCategory
    title: str
    difficulty: str
    rewardXp: int = Field(ge=0)
    estimatedTime: str
    summary: str
    objectives: list[str]
    supportedComponents: list[str]
    hint: str
    scoringDimensions: list[ScoringDimension]
    validationRules: dict[str, object] = Field(default_factory=dict)
    surface: ChallengeSurface = "builder"
    gameModeId: str
    allowedNodeTypeIds: list[str] = Field(default_factory=list)
    maxNodes: int | None = Field(default=None, ge=1)
    timeLimitSeconds: int | None = Field(default=None, ge=1)


class ChallengeSummary(BaseModel):
    id: str
    category: ChallengeCategory
    title: str
    difficulty: str
    rewardXp: int
    estimatedTime: str
    summary: str


class ChallengeDetail(ChallengeSummary):
    manifestVersion: int
    objectives: list[str]
    supportedComponents: list[str]
    hint: str
    scoringDimensions: list[ScoringDimension]
    validationRules: dict[str, object]
    surface: ChallengeSurface
    gameModeId: str
    allowedNodeTypeIds: list[str]
    maxNodes: int | None
    timeLimitSeconds: int | None


class ChallengeConfig(BaseModel):
    challengeId: str
    category: ChallengeCategory
    surface: ChallengeSurface
    gameModeId: str
    allowedNodeTypeIds: list[str]
    maxNodes: int | None
    timeLimitSeconds: int | None
