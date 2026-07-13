from fastapi import APIRouter, HTTPException

from app.schemas.build import ValidateBuildRequest, ValidateBuildResponse
from app.services.challenge_loader import load_challenge
from app.services.validation_engine import validate_pipeline

router = APIRouter(tags=["build"])


@router.post("/build/validate", response_model=ValidateBuildResponse)
def validate_build(payload: ValidateBuildRequest):
    challenge = load_challenge(payload.challengeId)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return validate_pipeline(challenge, payload.nodes, payload.edges)
