from fastapi import APIRouter, HTTPException

from app.schemas.agent_sql import AgentRunRequest, AgentRunResponse
from app.schemas.build import ValidateBuildRequest, ValidateBuildResponse
from app.services.agent_challenge_loader import load_agent_challenge
from app.services.agent_dataset_loader import get_agent_dataset, list_agent_datasets
from app.services.agent_sql_engine import run_agent_sql
from app.services.agent_validation_engine import validate_agent_pipeline

router = APIRouter(tags=["agents"])


@router.get("/agent/datasets")
def get_agent_datasets():
    return list_agent_datasets()


@router.get("/agent/datasets/{dataset_id}")
def get_agent_dataset_detail(dataset_id: str):
    dataset = get_agent_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@router.post("/agent/validate", response_model=ValidateBuildResponse)
def validate_agent(payload: ValidateBuildRequest):
    if payload.challengeId != "agent-sql-001":
        raise HTTPException(status_code=404, detail="Agent challenge not found")
    return validate_agent_pipeline(payload.nodes, payload.edges)


@router.post("/agent/run", response_model=AgentRunResponse)
def run_agent(payload: AgentRunRequest):
    if not load_agent_challenge(payload.challengeId):
        raise HTTPException(status_code=404, detail="Agent challenge not found")
    try:
        return run_agent_sql(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Agent execution failed: {exc}") from exc
