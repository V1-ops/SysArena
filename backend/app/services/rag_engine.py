import re
import uuid
import hashlib
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from time import perf_counter

import faiss
import numpy as np
import requests
from pypdf import PdfReader

from app.core.config import get_settings
from app.schemas.build import BuildEdge, BuildNode
from app.schemas.build import ValidateBuildResponse
from app.schemas.rag import (
    JudgeFeedback,
    ExecutionDiagnostics,
    RagMetrics,
    RagRunResponse,
    RetrievedChunk,
    ScoreBreakdown,
    SimulationEvent,
)
from app.services.challenge_loader import load_challenge_queries, load_challenge_source


@dataclass
class ExecutionPlan:
    status_by_node_id: dict[str, str]
    reason_by_node_id: dict[str, str]
    degraded_node_ids: list[str]
    skipped_node_ids: list[str]
    warnings: list[str]


def _resolve_model_selection(
    selection: str,
    configured_model: str,
    requested_external: bool,
    model_kind: str,
    warnings: list[str],
) -> tuple[str, bool]:
    local_aliases = {"", "local", "local deterministic", "local-hash", "local-extractive"}
    if selection.strip().lower() in local_aliases:
        return ("local-hash" if model_kind == "embedding" else "local-extractive"), False
    if not requested_external:
        warnings.append(f"{model_kind.title()} model '{selection}' requires external execution; using local execution.")
        return ("local-hash" if model_kind == "embedding" else "local-extractive"), False
    if selection.strip().lower() in {"configured hugging face", configured_model.lower()}:
        return configured_model, True
    warnings.append(f"Unsupported {model_kind} model '{selection}'; using the configured Hugging Face model.")
    return configured_model, True


def _build_execution_plan(
    nodes: list[BuildNode],
    edges: list[BuildEdge],
    normalized_pipeline: list[str],
    validation: ValidateBuildResponse,
) -> ExecutionPlan:
    node_map = {node.id: node for node in nodes}
    invalid_pairs = {(item.source, item.target) for item in validation.invalidEdges}
    adjacency: dict[str, list[str]] = {node.id: [] for node in nodes}
    incoming: dict[str, int] = {node.id: 0 for node in nodes}
    for edge in edges:
        if edge.source not in node_map or edge.target not in node_map or (edge.source, edge.target) in invalid_pairs:
            continue
        adjacency[edge.source].append(edge.target)
        incoming[edge.target] += 1

    pdf_roots = [node.id for node in nodes if node.label == "PDF Loader"]
    roots = pdf_roots or [node_id for node_id, count in incoming.items() if count == 0]
    reachable: set[str] = set()
    queue = list(roots)
    while queue:
        node_id = queue.pop(0)
        if node_id in reachable:
            continue
        reachable.add(node_id)
        queue.extend(adjacency[node_id])

    invalid_node_ids = {
        node_id
        for item in validation.invalidEdges
        for node_id in (item.source, item.target)
        if node_id in node_map
    }
    feedback_text = " ".join(validation.feedback)
    status_by_node_id: dict[str, str] = {}
    reason_by_node_id: dict[str, str] = {}
    degraded_node_ids: list[str] = []
    skipped_node_ids: list[str] = []

    for node in nodes:
        label_in_feedback = node.label in feedback_text
        if node.id in invalid_node_ids or (node.id in reachable and label_in_feedback and not validation.isValid):
            status_by_node_id[node.id] = "degraded"
            reason_by_node_id[node.id] = "This stage is connected through an invalid or non-canonical edge."
            degraded_node_ids.append(node.id)
        elif node.id not in reachable:
            status_by_node_id[node.id] = "skipped"
            reason_by_node_id[node.id] = "This stage is not reachable from the PDF Loader through valid connections."
            skipped_node_ids.append(node.id)
        else:
            status_by_node_id[node.id] = "completed"

    warnings = [
        item
        for item in validation.feedback
        if not item.startswith("Optional improvement") and not item.startswith("Pipeline is valid")
    ]
    if not normalized_pipeline:
        warnings.append("No executable stages were found in the submitted graph.")
    return ExecutionPlan(status_by_node_id, reason_by_node_id, degraded_node_ids, skipped_node_ids, warnings)


def run_rag_pipeline(
    challenge,
    nodes: list[BuildNode],
    edges: list[BuildEdge],
    query: str,
    normalized_pipeline: list[str],
    validation: ValidateBuildResponse,
) -> RagRunResponse:
    settings = get_settings()
    start = perf_counter()

    node_values = {node.label: node.values for node in nodes}
    runtime_warnings: list[str] = []
    requested_external = settings.rag_execution_mode == "external" and bool(settings.huggingface_api_token)
    if settings.rag_execution_mode not in {"local", "external"}:
        runtime_warnings.append("Unknown RAG_EXECUTION_MODE; using local deterministic execution.")
    if settings.rag_execution_mode == "external" and not settings.huggingface_api_token:
        runtime_warnings.append("External execution was requested without a Hugging Face token; using local execution.")

    chunk_size = _bounded_int(
        node_values.get("Recursive Text Splitting", {}).get("chunkSize"),
        settings.rag_chunk_size,
        minimum=100,
        maximum=2000,
    )
    chunk_overlap = _bounded_int(
        node_values.get("Recursive Text Splitting", {}).get("overlap"),
        settings.rag_chunk_overlap,
        minimum=0,
        maximum=max(0, chunk_size - 1),
    )
    top_k = _bounded_int(
        node_values.get("Dense Retriever", {}).get("topK"),
        settings.rag_top_k,
        minimum=1,
        maximum=20,
    )
    reranker_used = "Reranker" in normalized_pipeline
    embedding_selection = str(node_values.get("Embeddings", {}).get("model", "Local deterministic"))
    generation_selection = str(node_values.get("LLM", {}).get("model", "Local deterministic"))
    embedding_model, embedding_external = _resolve_model_selection(
        embedding_selection,
        settings.hf_embedding_model,
        requested_external,
        "embedding",
        runtime_warnings,
    )
    generation_model, generation_external = _resolve_model_selection(
        generation_selection,
        settings.hf_llm_model,
        requested_external,
        "generation",
        runtime_warnings,
    )
    vector_provider = str(node_values.get("FAISS Vector Store", {}).get("provider", "FAISS"))
    if vector_provider != "FAISS":
        runtime_warnings.append(f"Vector provider '{vector_provider}' is not supported by this runtime; using FAISS.")
    rerank_strategy = str(node_values.get("Reranker", {}).get("strategy", "Lexical Hybrid"))
    if rerank_strategy != "Lexical Hybrid":
        runtime_warnings.append(f"Reranker strategy '{rerank_strategy}' is not supported; using Lexical Hybrid.")
        rerank_strategy = "Lexical Hybrid"
    prompt_style = str(node_values.get("Prompt Template", {}).get("style", "Structured QA"))
    if prompt_style != "Structured QA":
        runtime_warnings.append(f"Prompt style '{prompt_style}' is not supported; using Structured QA.")
        prompt_style = "Structured QA"
    temperature = _bounded_float(
        node_values.get("LLM", {}).get("temperature"),
        0.2,
        minimum=0.0,
        maximum=1.0,
    )

    document_path = load_challenge_source(challenge.id)
    chunks, faiss_index, index_used_external, index_warnings = _load_or_build_index(
        document_path=document_path,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        use_external=embedding_external,
        embedding_model=embedding_model,
        timeout_seconds=settings.rag_external_timeout_seconds,
    )
    runtime_warnings.extend(index_warnings)

    query_embedding, query_used_external, query_warning = _embed_single(
        query,
        use_external=index_used_external,
        model=embedding_model,
        timeout_seconds=settings.rag_external_timeout_seconds,
    )
    if query_warning:
        runtime_warnings.append(query_warning)
    if index_used_external and not query_used_external:
        runtime_warnings.append("Query embedding fell back to local execution to preserve vector dimensions.")
    dense_hits = _dense_retrieve(faiss_index, chunks, query_embedding, max(top_k, settings.rag_rerank_k if reranker_used else top_k))
    reranked_hits = _rerank_hits(query, dense_hits, top_k, rerank_strategy) if reranker_used else dense_hits[:top_k]
    query_spec = _match_query_spec(challenge.id, query)
    prompt = _build_prompt(query, reranked_hits, prompt_style, query_spec.get("answerLead", "Based on the document,"))
    answer, answer_used_external, answer_warning = _generate_structured_answer(
        prompt,
        use_external=generation_external,
        model=generation_model,
        temperature=temperature,
        timeout_seconds=settings.rag_external_timeout_seconds,
        answer_lead=query_spec.get("answerLead", "Based on the document,"),
    )
    if answer_warning:
        runtime_warnings.append(answer_warning)

    latency_ms = int((perf_counter() - start) * 1000)
    retrieved = [
        RetrievedChunk(chunkId=f"chunk-{item['chunk_id']}", text=item["text"], score=round(float(item["score"]), 4))
        for item in reranked_hits
    ]
    actual_external = index_used_external and query_used_external or answer_used_external
    metrics = RagMetrics(
        latencyMs=latency_ms,
        retrievedChunkCount=len(retrieved),
        topK=top_k,
        contextChars=sum(len(chunk.text) for chunk in retrieved),
        estimatedCost="HF Inference API usage" if actual_external else "Local deterministic execution",
        chunkSize=chunk_size,
        chunkOverlap=chunk_overlap,
        rerankerUsed=reranker_used,
        executionMode="external" if actual_external else "local",
        embeddingModel=embedding_model if index_used_external else "local-hash",
        generationModel=generation_model if answer_used_external else "local-extractive",
    )
    execution_plan = _build_execution_plan(nodes, edges, normalized_pipeline, validation)
    score_breakdown = _score_run(
        normalized_pipeline=normalized_pipeline,
        answer=answer,
        retrieved_chunks=retrieved,
        query_spec=query_spec,
        latency_ms=latency_ms,
        top_k=top_k,
        validation=validation,
        scoring_dimensions=challenge.scoringDimensions,
        degraded_count=len(execution_plan.degraded_node_ids),
        skipped_count=len(execution_plan.skipped_node_ids),
    )
    judge_feedback = _build_judge_feedback(normalized_pipeline, score_breakdown, validation.feedback)
    simulation_timeline = _build_timeline(
        nodes=nodes,
        normalized_pipeline=normalized_pipeline,
        query=query,
        chunk_count=len(chunks),
        retrieved_chunks=retrieved,
        used_optional_rerank=reranker_used,
        latency_ms=max(latency_ms, 1),
        execution_plan=execution_plan,
    )
    return RagRunResponse(
        runId=str(uuid.uuid4()),
        status="completed",
        answer=answer,
        retrievedChunks=retrieved,
        metrics=metrics,
        simulationTimeline=simulation_timeline,
        scoreBreakdown=score_breakdown,
        judgeFeedback=judge_feedback,
        pipelineValid=validation.isValid,
        validationFeedback=validation.feedback,
        executionDiagnostics=ExecutionDiagnostics(
            degradedNodeIds=execution_plan.degraded_node_ids,
            skippedNodeIds=execution_plan.skipped_node_ids,
            warnings=runtime_warnings + execution_plan.warnings,
        ),
    )


@lru_cache(maxsize=4)
def _extract_pdf_text(pdf_path: str) -> str:
    if Path(pdf_path).suffix.lower() == ".txt":
        return re.sub(r"\n{2,}", "\n\n", Path(pdf_path).read_text(encoding="utf-8")).strip()
    reader = PdfReader(pdf_path)
    parts = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    text = "\n".join(parts)
    return re.sub(r"\n{2,}", "\n\n", text).strip()


def _recursive_split(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    separators = ["\n\n", "\n", ". ", ", ", " "]
    chunks = _split_with_separators(text, chunk_size, separators)
    merged: list[str] = []
    for chunk in chunks:
        cleaned = re.sub(r"\s+", " ", chunk).strip()
        if not cleaned:
            continue
        if not merged:
            merged.append(cleaned)
            continue
        previous = merged[-1]
        overlap_text = previous[-chunk_overlap:] if len(previous) > chunk_overlap else previous
        merged.append(f"{overlap_text} {cleaned}".strip())
    return merged


@lru_cache(maxsize=4)
def _load_or_build_index(
    document_path: str,
    chunk_size: int,
    chunk_overlap: int,
    use_external: bool,
    embedding_model: str,
    timeout_seconds: int,
) -> tuple[list[str], faiss.IndexFlatIP, bool, tuple[str, ...]]:
    text = _extract_pdf_text(document_path)
    if not text.strip():
        raise ValueError("The challenge source document contains no extractable text.")
    chunks = _recursive_split(text, chunk_size, chunk_overlap)
    embeddings, used_external, warnings = _embed_batch(chunks, use_external, embedding_model, timeout_seconds)
    if use_external and not used_external:
        local_embeddings, _, _ = _embed_batch(chunks, False, "local-hash", timeout_seconds)
        embeddings = local_embeddings
        warnings = (*warnings, "Embedding service was unavailable; rebuilt the index with local embeddings.")
    return chunks, _build_faiss_index(embeddings), used_external, tuple(warnings)


def _bounded_int(value, fallback: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = fallback
    return max(minimum, min(parsed, maximum))


def _bounded_float(value, fallback: float, minimum: float, maximum: float) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = fallback
    return max(minimum, min(parsed, maximum))


def _split_with_separators(text: str, chunk_size: int, separators: list[str]) -> list[str]:
    if len(text) <= chunk_size:
        return [text]
    if not separators:
        return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]

    separator = separators[0]
    parts = text.split(separator)
    if len(parts) == 1:
        return _split_with_separators(text, chunk_size, separators[1:])

    chunks: list[str] = []
    current = ""
    for part in parts:
        candidate = f"{current}{separator if current else ''}{part}".strip()
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current:
                chunks.extend(_split_with_separators(current, chunk_size, separators[1:]))
            current = part
    if current:
        chunks.extend(_split_with_separators(current, chunk_size, separators[1:]))
    return chunks


def _embed_batch(
    texts: list[str],
    use_external: bool,
    model: str,
    timeout_seconds: int,
) -> tuple[np.ndarray, bool, tuple[str, ...]]:
    vectors = []
    warnings: list[str] = []
    external_successes = 0
    for text in texts:
        vector, used_external, warning = _embed_single(text, use_external, model, timeout_seconds)
        vectors.append(vector)
        external_successes += int(used_external)
        if warning and warning not in warnings:
            warnings.append(warning)
    used_external = bool(texts) and use_external and external_successes == len(texts)
    return np.array(vectors, dtype="float32"), used_external, tuple(warnings)


def _embed_single(
    text: str,
    use_external: bool = False,
    model: str | None = None,
    timeout_seconds: int | None = None,
) -> tuple[np.ndarray, bool, str | None]:
    settings = get_settings()
    if not use_external:
        return _fallback_embed(text), False, None

    url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model or settings.hf_embedding_model}"
    headers = {
        "Authorization": f"Bearer {settings.huggingface_api_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "inputs": text,
        "options": {"wait_for_model": True},
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=timeout_seconds or settings.rag_external_timeout_seconds)
        if not response.ok:
            raise RuntimeError(f"Hugging Face embedding request failed: {response.status_code} {response.text}")
        data = response.json()
        vector = _normalize_embedding_response(data)
        return np.array(vector, dtype="float32"), True, None
    except requests.RequestException as exc:
        return _fallback_embed(text), False, f"Embedding service unavailable; using local embeddings ({exc.__class__.__name__})."
    except RuntimeError:
        return _fallback_embed(text), False, "Embedding service returned an unsupported response; using local embeddings."


def _normalize_embedding_response(data) -> list[float]:
    if isinstance(data, list) and data and isinstance(data[0], (int, float)):
        return [float(x) for x in data]
    if isinstance(data, list) and data and isinstance(data[0], list):
        first = data[0]
        if first and isinstance(first[0], (int, float)):
            arr = np.array(data, dtype="float32")
            return arr.mean(axis=0).tolist()
        if first and isinstance(first[0], list):
            arr = np.array(data[0], dtype="float32")
            return arr.mean(axis=0).tolist()
    raise RuntimeError("Unexpected embedding response format from Hugging Face.")


def _build_faiss_index(embeddings: np.ndarray) -> faiss.IndexFlatIP:
    if embeddings.ndim != 2 or embeddings.shape[0] == 0:
        raise ValueError("The challenge source produced no searchable chunks.")
    normalized = embeddings.copy()
    faiss.normalize_L2(normalized)
    index = faiss.IndexFlatIP(normalized.shape[1])
    index.add(normalized)
    return index


def _dense_retrieve(index: faiss.IndexFlatIP, chunks: list[str], query_embedding: np.ndarray, top_k: int) -> list[dict]:
    query_vector = np.array([query_embedding], dtype="float32")
    faiss.normalize_L2(query_vector)
    scores, indices = index.search(query_vector, min(top_k, len(chunks)))
    hits: list[dict] = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0:
            continue
        hits.append({"chunk_id": int(idx), "text": chunks[int(idx)], "score": float(score)})
    return hits


def _rerank_hits(query: str, hits: list[dict], top_k: int, strategy: str = "Lexical Hybrid") -> list[dict]:
    query_terms = set(_tokenize(query))
    reranked = []
    for hit in hits:
        terms = set(_tokenize(hit["text"]))
        lexical_overlap = len(query_terms & terms)
        heading_bonus = 0.5 if any(term in hit["text"].lower() for term in query_terms) else 0.0
        rerank_score = float(hit["score"]) + lexical_overlap * 0.08 + heading_bonus
        reranked.append({**hit, "score": rerank_score})
    reranked.sort(key=lambda item: item["score"], reverse=True)
    return reranked[:top_k]


def _build_prompt(query: str, hits: list[dict], style: str, answer_lead: str) -> str:
    context_blocks = []
    for idx, hit in enumerate(hits, start=1):
        context_blocks.append(f"Chunk {idx}:\n{hit['text']}")
    context = "\n\n".join(context_blocks)
    format_instruction = "Use the structured QA format below." if style == "Structured QA" else "Use the configured answer format below."
    return (
        "You are a RAG assistant for Business Basics. "
        "Answer only from the provided context. "
        "If the answer is not clearly present, say that the document does not provide enough information.\n\n"
        f"Preferred answer lead: {answer_lead}\n\n"
        f"{format_instruction}\n"
        "Return a structured answer in markdown with exactly these sections:\n"
        "## Final Answer\n## Key Concepts\n## Evidence From Document\n\n"
        f"User Query:\n{query}\n\n"
        f"Context:\n{context}"
    )


def _generate_structured_answer(
    prompt: str,
    use_external: bool,
    model: str,
    temperature: float,
    timeout_seconds: int,
    answer_lead: str,
) -> tuple[str, bool, str | None]:
    settings = get_settings()
    if not use_external:
        return _fallback_generate_answer(prompt, answer_lead), False, None

    url = f"https://api-inference.huggingface.co/models/{model}"
    headers = {
        "Authorization": f"Bearer {settings.huggingface_api_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 700,
            "temperature": temperature,
            "return_full_text": False
        },
        "options": {"wait_for_model": True}
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=timeout_seconds)
        if not response.ok:
            raise RuntimeError(f"Hugging Face generation request failed: {response.status_code} {response.text}")

        data = response.json()
        if isinstance(data, list) and data and "generated_text" in data[0]:
            return data[0]["generated_text"].strip(), True, None
        if isinstance(data, dict) and "generated_text" in data:
            return data["generated_text"].strip(), True, None
        raise RuntimeError("Unexpected generation response format from Hugging Face.")
    except requests.RequestException as exc:
        return _fallback_generate_answer(prompt, answer_lead), False, f"Generation service unavailable; using local answer generation ({exc.__class__.__name__})."
    except RuntimeError:
        return _fallback_generate_answer(prompt, answer_lead), False, "Generation service returned an unsupported response; using local answer generation."


def _fallback_embed(text: str, dim: int = 384) -> np.ndarray:
    vector = np.zeros(dim, dtype="float32")
    tokens = _tokenize(text)
    if not tokens:
        return vector
    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        bucket = int.from_bytes(digest[:4], "big") % dim
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[bucket] += sign
    norm = np.linalg.norm(vector)
    return vector if norm == 0 else vector / norm


def _fallback_generate_answer(prompt: str, answer_lead: str) -> str:
    query_match = re.search(r"User Query:\n(.*?)\n\nContext:\n", prompt, flags=re.S)
    context_match = re.search(r"Context:\n(.*)$", prompt, flags=re.S)
    query = query_match.group(1).strip() if query_match else ""
    context = context_match.group(1).strip() if context_match else ""
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", context) if s.strip()]
    query_terms = set(_tokenize(query))

    ranked: list[tuple[int, str]] = []
    for sentence in sentences:
        sentence_terms = set(_tokenize(sentence))
        overlap = len(query_terms & sentence_terms)
        if overlap > 0:
            ranked.append((overlap, sentence))

    ranked.sort(key=lambda item: item[0], reverse=True)
    best_sentences = [sentence for _, sentence in ranked[:3]]
    if not best_sentences and sentences:
        best_sentences = sentences[:2]

    final_answer = " ".join(best_sentences[:2]).strip() or "The document does not provide enough information to answer the query clearly."
    if answer_lead.strip() and not final_answer.lower().startswith(answer_lead.strip().lower()):
        final_answer = f"{answer_lead.strip()} {final_answer}"
    key_concepts = sorted(query_terms)[:5]
    evidence_lines = best_sentences[:3] if best_sentences else ["No directly relevant evidence was found in the retrieved context."]

    concepts_md = "\n".join(f"- {concept}" for concept in key_concepts) if key_concepts else "- No strong concepts extracted"
    evidence_md = "\n".join(f"- {line}" for line in evidence_lines)

    return (
        "## Final Answer\n"
        f"{final_answer}\n\n"
        "## Key Concepts\n"
        f"{concepts_md}\n\n"
        "## Evidence From Document\n"
        f"{evidence_md}"
    )


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z]+", text.lower())


def _match_query_spec(challenge_id: str, query: str) -> dict:
    queries = load_challenge_queries(challenge_id)
    lowered = query.strip().lower()
    for item in queries:
        if item["query"].strip().lower() == lowered:
            return item
    return {"query": query, "expectedKeywords": [], "answerLead": "Based on the document,"}


def _score_run(
    normalized_pipeline: list[str],
    answer: str,
    retrieved_chunks: list[RetrievedChunk],
    query_spec: dict,
    latency_ms: int,
    top_k: int,
    validation: ValidateBuildResponse,
    scoring_dimensions,
    degraded_count: int,
    skipped_count: int,
) -> list[ScoreBreakdown]:
    configured_max = {item.label: item.weight for item in scoring_dimensions}
    max_scores = {
        "Architecture correctness": configured_max.get("Architecture correctness", 40),
        "Retrieval readiness": configured_max.get("Retrieval readiness", 20),
        "Answer quality": configured_max.get("Answer quality", 20),
        "Latency performance": configured_max.get("Latency performance", 10),
        "Best-practice bonus": configured_max.get("Best-practice bonus", 10),
    }
    architecture = max_scores["Architecture correctness"]
    architecture -= len(validation.requiredMissingNodes) * 8
    architecture -= len(validation.invalidEdges) * 5
    architecture -= degraded_count * 3
    architecture -= skipped_count * 5
    blocking_feedback = [
        item for item in validation.feedback
        if not item.startswith("Optional improvement") and not item.startswith("Pipeline is valid")
    ]
    architecture -= len(blocking_feedback) * 3
    if "Reranker" not in normalized_pipeline:
        architecture -= 4
    if "Prompt Template" not in normalized_pipeline:
        architecture -= 3

    retrieval = max_scores["Retrieval readiness"] if retrieved_chunks else max(0, max_scores["Retrieval readiness"] // 3)
    if len(retrieved_chunks) < min(top_k, 2):
        retrieval -= 4

    expected = [keyword.lower() for keyword in query_spec.get("expectedKeywords", [])]
    haystack = " ".join([answer] + [chunk.text for chunk in retrieved_chunks]).lower()
    if expected:
        matched = sum(1 for keyword in expected if keyword in haystack)
        answer_quality = min(max_scores["Answer quality"], max(0, int((matched / len(expected)) * max_scores["Answer quality"])))
    else:
        stop_words = {"a", "an", "and", "are", "about", "be", "by", "for", "from", "how", "in", "is", "of", "on", "or", "the", "to", "what", "why", "with"}
        query_terms = {term for term in _tokenize(query_spec.get("query", "")) if term not in stop_words}
        evidence_terms = set(_tokenize(" ".join(chunk.text for chunk in retrieved_chunks)))
        answer_terms = set(_tokenize(answer))
        evidence_coverage = len(query_terms & evidence_terms) / max(len(query_terms), 1)
        answer_support = len(query_terms & answer_terms) / max(len(query_terms), 1)
        structure = sum(section in answer for section in ("## Final Answer", "## Key Concepts", "## Evidence From Document")) / 3
        answer_quality = int(max_scores["Answer quality"] * min(1.0, evidence_coverage * 0.55 + answer_support * 0.35 + structure * 0.1))

    latency = max_scores["Latency performance"] if latency_ms < 10000 else max(0, max_scores["Latency performance"] - 2) if latency_ms < 20000 else max(0, max_scores["Latency performance"] - 4)
    best_practice = max_scores["Best-practice bonus"]
    if "Prompt Template" not in normalized_pipeline:
        best_practice -= 4
    if "Reranker" not in normalized_pipeline:
        best_practice -= 3

    raw_scores = {
        "Architecture correctness": architecture,
        "Retrieval readiness": retrieval,
        "Answer quality": answer_quality,
        "Latency performance": latency,
        "Best-practice bonus": best_practice,
    }
    return [
        ScoreBreakdown(label=label, score=max(0, min(raw_scores.get(label, 0), max_score)), maxScore=max_score)
        for label, max_score in max_scores.items()
    ]


def _build_judge_feedback(
    normalized_pipeline: list[str],
    score_breakdown: list[ScoreBreakdown],
    validation_feedback: list[str],
) -> JudgeFeedback:
    total = sum(item.score for item in score_breakdown)
    positive = "Your pipeline includes the core RAG stages needed to answer from the business PDF."
    weakness = "The quality of the final answer depends heavily on retrieved chunk relevance."
    next_step = "Improve retrieval precision with reranking and keep the prompt template explicit."
    recommendations = [
        "Use Recursive Text Splitting before embeddings so FAISS indexes meaningful chunks.",
        "Keep FAISS and Dense Retriever in sequence before the reranker.",
        "Use the prompt template to force a structured business-oriented answer.",
    ]
    if "Reranker" in normalized_pipeline and "Prompt Template" in normalized_pipeline:
        weakness = "Your biggest remaining optimization is latency from embedding plus generation calls."
        next_step = "Cache embeddings or reduce chunk volume to make the experience faster."
    if total >= 90:
        positive = "Excellent build. This RAG pipeline is structurally strong and close to a production-ready business QA flow."
    blocking_feedback = [
        item for item in validation_feedback
        if not item.startswith("Optional improvement") and not item.startswith("Pipeline is valid")
    ]
    if blocking_feedback:
        weakness = blocking_feedback[0]
        next_step = "Fix the highlighted connection or missing component, then run the simulation again."
        recommendations = blocking_feedback[:3] + recommendations[: max(0, 3 - len(blocking_feedback))]
    return JudgeFeedback(
        positive=positive,
        weakness=weakness,
        nextStep=next_step,
        recommendations=recommendations,
    )


def _build_timeline(
    nodes: list[BuildNode],
    normalized_pipeline: list[str],
    query: str,
    chunk_count: int,
    retrieved_chunks: list[RetrievedChunk],
    used_optional_rerank: bool,
    latency_ms: int,
    execution_plan: ExecutionPlan,
) -> list[SimulationEvent]:
    del used_optional_rerank, latency_ms
    node_ids = {node.label: node.id for node in nodes}
    durations = {
        "PDF Loader": 260,
        "Recursive Text Splitting": 420,
        "Embeddings": 900,
        "FAISS Vector Store": 360,
        "Dense Retriever": 420,
        "Reranker": 360,
        "Prompt Template": 260,
        "LLM": 900,
    }
    metadata = {
        "PDF Loader": {"document": "Business Basics PDF", "sourceLocked": True},
        "Recursive Text Splitting": {"chunkCount": chunk_count},
        "Embeddings": {"chunkCount": chunk_count},
        "FAISS Vector Store": {"indexedChunkCount": chunk_count},
        "Dense Retriever": {"query": query, "retrievedChunkCount": len(retrieved_chunks)},
        "Reranker": {"retrievedChunkCount": len(retrieved_chunks)},
        "Prompt Template": {"contextChars": sum(len(chunk.text) for chunk in retrieved_chunks)},
        "LLM": {"previewText": retrieved_chunks[0].text[:120] if retrieved_chunks else ""},
    }
    timeline: list[SimulationEvent] = []
    next_start = 0
    for index, label in enumerate(normalized_pipeline):
        node_id = node_ids.get(label)
        status = execution_plan.status_by_node_id.get(node_id or "", "completed")
        duration = 120 if status == "skipped" else 220 if status == "degraded" else durations.get(label, 300)
        event_meta = dict(metadata.get(label, {}))
        if status != "completed":
            event_meta["reason"] = execution_plan.reason_by_node_id.get(node_id or "", "Stage could not execute normally.")
        timeline.append(
            SimulationEvent(
                id=f"rag-step-{index}-{label.lower().replace(' ', '-')}",
                type=label.lower().replace(" ", "-"),
                label=label,
                status=status,
                nodeId=node_id,
                startedAtOffsetMs=next_start,
                durationMs=duration,
                meta=event_meta,
            )
        )
        next_start += duration
    return timeline
