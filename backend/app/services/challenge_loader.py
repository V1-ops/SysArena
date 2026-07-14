import json
from functools import lru_cache
from pathlib import Path

from app.core.config import get_settings
from app.schemas.challenge import ChallengeDetail, ChallengeSummary, ScoringDimension

ROOT = Path(__file__).resolve().parents[3]
RAG_DIR = ROOT / "content" / "challenges" / "rag"


@lru_cache(maxsize=16)
def _load_challenge_json(challenge_id: str) -> dict | None:
    file_path = RAG_DIR / f"{challenge_id}.challenge.json"
    if not file_path.exists():
        return None
    return json.loads(file_path.read_text(encoding="utf-8"))


@lru_cache(maxsize=16)
def _load_queries_json(challenge_id: str) -> list[dict]:
    file_path = RAG_DIR / f"{challenge_id}.queries.json"
    if not file_path.exists():
        return []
    return json.loads(file_path.read_text(encoding="utf-8"))


def list_rag_challenges() -> list[ChallengeSummary]:
    summaries: list[ChallengeSummary] = []
    for file_path in sorted(RAG_DIR.glob("*.challenge.json")):
        challenge_id = file_path.name.replace(".challenge.json", "")
        detail = load_challenge(challenge_id)
        if detail:
            summaries.append(
                ChallengeSummary(
                    id=detail.id,
                    title=detail.title,
                    difficulty=detail.difficulty,
                    rewardXp=detail.rewardXp,
                    estimatedTime=detail.estimatedTime,
                    summary=detail.summary,
                )
            )
    return summaries


def load_challenge(challenge_id: str) -> ChallengeDetail | None:
    raw = _load_challenge_json(challenge_id)
    if not raw:
        return None

    queries = _load_queries_json(challenge_id)
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
        sampleQueries=[item["query"] for item in queries],
        scoringDimensions=[ScoringDimension(**item) for item in raw["scoringDimensions"]],
        validationRules=raw["validationRules"],
    )


def load_challenge_queries(challenge_id: str) -> list[dict]:
    return _load_queries_json(challenge_id)


def load_challenge_source(challenge_id: str) -> str:
    settings = get_settings()
    pdf_path = RAG_DIR / f"{challenge_id}.source.pdf"
    if challenge_id == "university-rag-001" and settings.rag_source_pdf_path.exists():
        return str(settings.rag_source_pdf_path)
    if pdf_path.exists():
        return str(pdf_path)
    source_path = RAG_DIR / f"{challenge_id}.source.txt"
    if source_path.exists():
        return str(source_path)
    raise FileNotFoundError(f"No source document exists for challenge '{challenge_id}'.")
