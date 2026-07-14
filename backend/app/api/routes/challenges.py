from fastapi import APIRouter, HTTPException

from app.schemas.challenge import ChallengeDetail, ChallengeSummary
from app.services.agent_challenge_loader import load_agent_challenge
from app.services.challenge_loader import list_rag_challenges, load_challenge

router = APIRouter(tags=["challenges"])


@router.get("/challenges/rag", response_model=list[ChallengeSummary])
def get_rag_challenges():
    return list_rag_challenges()


@router.get("/challenges/{challenge_id}", response_model=ChallengeDetail)
def get_challenge_detail(challenge_id: str):
    challenge = load_agent_challenge(challenge_id) or load_challenge(challenge_id)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge
