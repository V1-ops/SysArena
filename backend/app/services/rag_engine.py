import re
import uuid
import hashlib
from functools import lru_cache
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
    RagMetrics,
    RagRunResponse,
    RetrievedChunk,
    ScoreBreakdown,
    SimulationEvent,
)
from app.services.challenge_loader import load_challenge_queries, load_challenge_source


def run_rag_pipeline(
    challenge,
    nodes: list[BuildNode],
    edges: list[BuildEdge],
    query: str,
    normalized_pipeline: list[str],
    validation: ValidateBuildResponse,
) -> RagRunResponse:
    del edges
    settings = get_settings()
    start = perf_counter()

    node_values = {node.label: node.values for node in nodes}
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

    document_path = load_challenge_source(challenge.id)
    chunks, faiss_index = _load_or_build_index(
        document_path=document_path,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    query_embedding = _embed_single(query)
    dense_hits = _dense_retrieve(faiss_index, chunks, query_embedding, max(top_k, settings.rag_rerank_k if reranker_used else top_k))
    reranked_hits = _rerank_hits(query, dense_hits, top_k) if reranker_used else dense_hits[:top_k]
    prompt = _build_prompt(query, reranked_hits)
    answer = _generate_structured_answer(prompt)

    latency_ms = int((perf_counter() - start) * 1000)
    retrieved = [
        RetrievedChunk(chunkId=f"chunk-{item['chunk_id']}", text=item["text"], score=round(float(item["score"]), 4))
        for item in reranked_hits
    ]
    metrics = RagMetrics(
        latencyMs=latency_ms,
        retrievedChunkCount=len(retrieved),
        topK=top_k,
        contextChars=sum(len(chunk.text) for chunk in retrieved),
        estimatedCost="HF Inference API usage" if settings.huggingface_api_token else "Local deterministic fallback",
        chunkSize=chunk_size,
        chunkOverlap=chunk_overlap,
        rerankerUsed=reranker_used,
    )
    query_spec = _match_query_spec(challenge.id, query)
    score_breakdown = _score_run(
        normalized_pipeline=normalized_pipeline,
        answer=answer,
        retrieved_chunks=retrieved,
        query_spec=query_spec,
        latency_ms=latency_ms,
        top_k=top_k,
        validation=validation,
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
    )


@lru_cache(maxsize=4)
def _extract_pdf_text(pdf_path: str) -> str:
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
) -> tuple[list[str], faiss.IndexFlatIP]:
    text = _extract_pdf_text(document_path)
    chunks = _recursive_split(text, chunk_size, chunk_overlap)
    return chunks, _build_faiss_index(_embed_batch(chunks))


def _bounded_int(value, fallback: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
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


def _embed_batch(texts: list[str]) -> np.ndarray:
    return np.array([_embed_single(text) for text in texts], dtype="float32")


def _embed_single(text: str) -> np.ndarray:
    settings = get_settings()
    if not settings.huggingface_api_token:
        return _fallback_embed(text)

    url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{settings.hf_embedding_model}"
    headers = {
        "Authorization": f"Bearer {settings.huggingface_api_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "inputs": text,
        "options": {"wait_for_model": True},
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        if not response.ok:
            raise RuntimeError(f"Hugging Face embedding request failed: {response.status_code} {response.text}")
        data = response.json()
        vector = _normalize_embedding_response(data)
        return np.array(vector, dtype="float32")
    except requests.RequestException:
        return _fallback_embed(text)
    except RuntimeError:
        return _fallback_embed(text)


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


def _rerank_hits(query: str, hits: list[dict], top_k: int) -> list[dict]:
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


def _build_prompt(query: str, hits: list[dict]) -> str:
    context_blocks = []
    for idx, hit in enumerate(hits, start=1):
        context_blocks.append(f"Chunk {idx}:\n{hit['text']}")
    context = "\n\n".join(context_blocks)
    return (
        "You are a RAG assistant for Business Basics. "
        "Answer only from the provided context. "
        "If the answer is not clearly present, say that the document does not provide enough information.\n\n"
        "Return a structured answer in markdown with exactly these sections:\n"
        "## Final Answer\n## Key Concepts\n## Evidence From Document\n\n"
        f"User Query:\n{query}\n\n"
        f"Context:\n{context}"
    )


def _generate_structured_answer(prompt: str) -> str:
    settings = get_settings()
    if not settings.huggingface_api_token:
        return _fallback_generate_answer(prompt)

    url = f"https://api-inference.huggingface.co/models/{settings.hf_llm_model}"
    headers = {
        "Authorization": f"Bearer {settings.huggingface_api_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 700,
            "temperature": 0.2,
            "return_full_text": False
        },
        "options": {"wait_for_model": True}
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=180)
        if not response.ok:
            raise RuntimeError(f"Hugging Face generation request failed: {response.status_code} {response.text}")

        data = response.json()
        if isinstance(data, list) and data and "generated_text" in data[0]:
            return data[0]["generated_text"].strip()
        if isinstance(data, dict) and "generated_text" in data:
            return data["generated_text"].strip()
        raise RuntimeError("Unexpected generation response format from Hugging Face.")
    except requests.RequestException:
        return _fallback_generate_answer(prompt)
    except RuntimeError:
        return _fallback_generate_answer(prompt)


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


def _fallback_generate_answer(prompt: str) -> str:
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
) -> list[ScoreBreakdown]:
    architecture = 40
    architecture -= len(validation.requiredMissingNodes) * 8
    architecture -= len(validation.invalidEdges) * 5
    blocking_feedback = [
        item for item in validation.feedback
        if not item.startswith("Optional improvement") and not item.startswith("Pipeline is valid")
    ]
    architecture -= len(blocking_feedback) * 3
    if "Reranker" not in normalized_pipeline:
        architecture -= 4
    if "Prompt Template" not in normalized_pipeline:
        architecture -= 3

    retrieval = 20 if retrieved_chunks else 6
    if len(retrieved_chunks) < min(top_k, 2):
        retrieval -= 4

    expected = [keyword.lower() for keyword in query_spec.get("expectedKeywords", [])]
    haystack = " ".join([answer] + [chunk.text for chunk in retrieved_chunks]).lower()
    matched = sum(1 for keyword in expected if keyword in haystack)
    answer_quality = 10 if not expected else min(20, max(8, int((matched / len(expected)) * 20)))

    latency = 10 if latency_ms < 10000 else 8 if latency_ms < 20000 else 6
    best_practice = 10
    if "Prompt Template" not in normalized_pipeline:
        best_practice -= 4
    if "Reranker" not in normalized_pipeline:
        best_practice -= 3

    return [
        ScoreBreakdown(label="Architecture correctness", score=max(architecture, 0), maxScore=40),
        ScoreBreakdown(label="Retrieval readiness", score=max(retrieval, 0), maxScore=20),
        ScoreBreakdown(label="Answer quality", score=max(answer_quality, 0), maxScore=20),
        ScoreBreakdown(label="Latency performance", score=max(latency, 0), maxScore=10),
        ScoreBreakdown(label="Best-practice bonus", score=max(best_practice, 0), maxScore=10),
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
        duration = durations.get(label, 300)
        timeline.append(
            SimulationEvent(
                id=f"rag-step-{index}-{label.lower().replace(' ', '-')}",
                type=label.lower().replace(" ", "-"),
                label=label,
                status="completed",
                nodeId=node_ids.get(label),
                startedAtOffsetMs=next_start,
                durationMs=duration,
                meta=metadata.get(label, {}),
            )
        )
        next_start += duration
    return timeline
