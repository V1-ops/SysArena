from pydantic import BaseModel


class ScoringDimension(BaseModel):
    label: str
    weight: int


class ChallengeSummary(BaseModel):
    id: str
    title: str
    difficulty: str
    rewardXp: int
    estimatedTime: str
    summary: str


class ChallengeDetail(ChallengeSummary):
    category: str
    objectives: list[str]
    supportedComponents: list[str]
    hint: str
    sampleQueries: list[str]
    scoringDimensions: list[ScoringDimension]
    validationRules: dict
