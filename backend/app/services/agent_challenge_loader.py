import json
from functools import lru_cache
from pathlib import Path

from app.schemas.challenge import ChallengeDetail, ScoringDimension

ROOT = Path(__file__).resolve().parents[3]
AGENT_DIR = ROOT / "content" / "challenges" / "agents"


@lru_cache(maxsize=8)
def load_agent_manifest(challenge_id: str) -> dict | None:
    file_path = AGENT_DIR / f"{challenge_id}.challenge.json"
    if not file_path.exists():
        return None
    return json.loads(file_path.read_text(encoding="utf-8"))


def load_agent_challenge(challenge_id: str) -> ChallengeDetail | None:
    raw = load_agent_manifest(challenge_id)
    if not raw:
        return None
    return ChallengeDetail(
        id=raw["id"],
        title=raw["title"],
        category=raw["category"],
        difficulty=raw["difficulty"],
        rewardXp=raw["rewardXp"],
        estimatedTime=raw["estimatedTime"],
        summary=raw["summary"],
        objectives=raw["objectives"],
        supportedComponents=raw["supportedComponents"],
        hint=raw["hint"],
        sampleQueries=raw.get("sampleQueries", []),
        scoringDimensions=[ScoringDimension(**item) for item in raw["scoringDimensions"]],
        validationRules=raw["validationRules"],
    )


def load_agent_sample_csv(challenge_id: str) -> str:
    raw = load_agent_manifest(challenge_id)
    return str(raw.get("sampleCsv", "")) if raw else ""
