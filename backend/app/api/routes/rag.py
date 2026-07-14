from fastapi import APIRouter, HTTPException

from app.schemas.rag import RagRunRequest, RagRunResponse
from app.services.challenge_loader import load_challenge
from app.services.validation_engine import validate_pipeline

router = APIRouter(tags=["rag"])


@router.post("/rag/run", response_model=RagRunResponse)
def run_rag(payload: RagRunRequest):
    challenge = load_challenge(payload.challengeId)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    validation = validate_pipeline(challenge, payload.nodes, payload.edges)

    try:
        from app.services.rag_engine import run_rag_pipeline

        return run_rag_pipeline(
            challenge=challenge,
            nodes=payload.nodes,
            edges=payload.edges,
            query=payload.query,
            normalized_pipeline=validation.normalizedPipeline,
            validation=validation,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="The challenge source document was not found.") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="The RAG execution dependency is unavailable.") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="RAG execution failed unexpectedly.") from exc
