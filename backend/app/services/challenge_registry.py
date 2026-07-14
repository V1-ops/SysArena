import json
from functools import lru_cache
from pathlib import Path

from app.contracts.v1 import ChallengeConfig, ChallengeDetail, ChallengeManifest, ChallengeSummary


ROOT = Path(__file__).resolve().parents[3]
MANIFEST_ROOT = ROOT / "content" / "challenges"


@lru_cache(maxsize=1)
def _load_manifests() -> tuple[ChallengeManifest, ...]:
    manifests: list[ChallengeManifest] = []
    seen_ids: set[str] = set()
    for path in sorted(MANIFEST_ROOT.glob("**/*.manifest.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        manifest = ChallengeManifest.model_validate(raw)
        if manifest.id in seen_ids:
            raise RuntimeError(f"Duplicate challenge manifest id: {manifest.id}")
        seen_ids.add(manifest.id)
        manifests.append(manifest)
    if not manifests:
        raise RuntimeError(f"No challenge manifests found under {MANIFEST_ROOT}")
    return tuple(manifests)


def list_challenges(category: str | None = None) -> list[ChallengeSummary]:
    manifests = _load_manifests()
    if category is not None:
        manifests = tuple(item for item in manifests if item.category == category)
    return [
        ChallengeSummary(
            id=item.id,
            category=item.category,
            title=item.title,
            difficulty=item.difficulty,
            rewardXp=item.rewardXp,
            estimatedTime=item.estimatedTime,
            summary=item.summary,
        )
        for item in manifests
    ]


def get_manifest(challenge_id: str) -> ChallengeManifest | None:
    return next((item for item in _load_manifests() if item.id == challenge_id), None)


def get_challenge_detail(challenge_id: str) -> ChallengeDetail | None:
    item = get_manifest(challenge_id)
    if item is None:
        return None
    return ChallengeDetail(**item.model_dump())


def get_challenge_config(challenge_id: str) -> ChallengeConfig | None:
    item = get_manifest(challenge_id)
    if item is None:
        return None
    return ChallengeConfig(
        challengeId=item.id,
        category=item.category,
        surface=item.surface,
        gameModeId=item.gameModeId,
        allowedNodeTypeIds=item.allowedNodeTypeIds,
        maxNodes=item.maxNodes,
        timeLimitSeconds=item.timeLimitSeconds,
    )
