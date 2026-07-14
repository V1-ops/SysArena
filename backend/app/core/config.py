import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


APP_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = APP_DIR.parent
ENV_PATH = BACKEND_DIR / ".env"


def _load_env_file() -> None:
    if not ENV_PATH.exists():
        return
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue
        key, value = raw.split("=", 1)
        key = key.strip()
        value = value.strip()
        if key and key not in os.environ:
            os.environ[key] = value


@dataclass(frozen=True)
class Settings:
    huggingface_api_token: str
    rag_execution_mode: str
    rag_external_timeout_seconds: int
    hf_llm_model: str
    hf_embedding_model: str
    rag_source_pdf_path: Path
    rag_top_k: int
    rag_rerank_k: int
    rag_chunk_size: int
    rag_chunk_overlap: int


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    _load_env_file()
    source_path = os.getenv("RAG_SOURCE_PDF_PATH", "../content/challenges/rag/university-rag-001.source.pdf")
    resolved_source = (BACKEND_DIR / source_path).resolve()
    return Settings(
        huggingface_api_token=os.getenv("HUGGINGFACE_API_TOKEN", ""),
        rag_execution_mode=os.getenv("RAG_EXECUTION_MODE", "local").strip().lower(),
        rag_external_timeout_seconds=int(os.getenv("RAG_EXTERNAL_TIMEOUT_SECONDS", "15")),
        hf_llm_model=os.getenv("HF_LLM_MODEL", "Qwen/Qwen2.5-7B-Instruct"),
        hf_embedding_model=os.getenv("HF_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"),
        rag_source_pdf_path=resolved_source,
        rag_top_k=int(os.getenv("RAG_TOP_K", "4")),
        rag_rerank_k=int(os.getenv("RAG_RERANK_K", "8")),
        rag_chunk_size=int(os.getenv("RAG_CHUNK_SIZE", "1200")),
        rag_chunk_overlap=int(os.getenv("RAG_CHUNK_OVERLAP", "180")),
    )
