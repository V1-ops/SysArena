from fastapi import APIRouter, HTTPException

from app.schemas.rag import RagRunRequest, RagRunResponse
from app.services.challenge_loader import load_challenge
from app.services.rag_engine import run_rag_pipeline
from app.services.validation_engine import validate_pipeline

router = APIRouter(tags=["rag"])


@router.post("/rag/run", response_model=RagRunResponse)
def run_rag(payload: RagRunRequest):
    challenge = load_challenge(payload.challengeId)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    validation = validate_pipeline(challenge, payload.nodes, payload.edges)
    if not validation.isValid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Pipeline validation failed",
                "validation": validation.model_dump(),
            },
        )

    try:
        return run_rag_pipeline(
            challenge=challenge,
            nodes=payload.nodes,
            edges=payload.edges,
            query=payload.query,
            normalized_pipeline=validation.normalizedPipeline,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"RAG execution failed: {exc}") from exc
