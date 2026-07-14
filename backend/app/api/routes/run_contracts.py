from fastapi import APIRouter, HTTPException, status

from app.contracts.v1 import (
    LeaderboardResponse,
    OptimizationRunRequest,
    RunRequest,
    RunResponse,
    ValidationIssue,
    ValidationResponse,
)
from app.schemas.build import BuildEdge, BuildNode
from app.services.challenge_loader import load_challenge
from app.services.challenge_registry import get_manifest, get_challenge_detail
from app.services.validation_engine import validate_pipeline


router = APIRouter(tags=["v1-contracts"])


@router.post("/runs/validate", response_model=ValidationResponse)
def validate_run(payload: RunRequest):
    manifest = get_manifest(payload.challengeId)
    if manifest is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if manifest.category != "rag":
        return ValidationResponse(
            challengeId=payload.challengeId,
            isValid=False,
            issues=[ValidationIssue(code="validator_unavailable", message="This category validator is provided by a later phase.")],
        )

    legacy_challenge = load_challenge(payload.challengeId)
    if legacy_challenge is None:
        raise HTTPException(status_code=404, detail="Challenge execution data not found")
    nodes = [BuildNode(id=node.id, type=node.type, label=node.label or node.type) for node in payload.graph.nodes]
    edges = [BuildEdge(source=edge.source, target=edge.target) for edge in payload.graph.edges]
    result = validate_pipeline(legacy_challenge, nodes, edges)
    return ValidationResponse(
        challengeId=payload.challengeId,
        isValid=result.isValid,
        issues=[
            ValidationIssue(code="invalid_edge", message=item.reason, edgeId=f"{item.source}->{item.target}")
            for item in result.invalidEdges
        ],
        feedback=result.feedback,
        normalizedPipeline=result.normalizedPipeline,
        scorePreview=max(0, min(100, result.scorePreview)),
    )


@router.post("/runs", response_model=RunResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
def create_run(payload: RunRequest):
    if get_challenge_detail(payload.challengeId) is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    raise HTTPException(status_code=501, detail="Generic run execution is owned by Phase 2.")


@router.get("/runs/{run_id}", response_model=RunResponse)
def get_run(run_id: str):
    raise HTTPException(status_code=404, detail=f"Run {run_id} was not found.")


@router.get("/leaderboards/{challenge_id}", response_model=LeaderboardResponse)
def get_leaderboard(challenge_id: str):
    if get_challenge_detail(challenge_id) is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return LeaderboardResponse(challengeId=challenge_id, entries=[])


@router.post("/optimization/runs", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def create_optimization_run(payload: OptimizationRunRequest):
    challenge_id = payload.challengeId
    if get_challenge_detail(challenge_id) is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    raise HTTPException(status_code=501, detail="Optimizer execution is owned by Phase 5.")
