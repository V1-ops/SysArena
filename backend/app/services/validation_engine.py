from collections import Counter, defaultdict, deque

from app.schemas.build import BuildEdge, BuildNode, InvalidEdge, ValidateBuildResponse

CANONICAL_CORE = [
    "PDF Loader",
    "Recursive Text Splitting",
    "Embeddings",
    "FAISS Vector Store",
    "Dense Retriever",
    "LLM",
]
OPTIONAL_COMPONENTS = {"Reranker", "Prompt Template"}

RAG_HANDLE_TYPES = {
    "pdf-loader": {"inputs": {}, "outputs": {"documents": "documents"}},
    "chunker": {"inputs": {"documents": "documents"}, "outputs": {"chunks": "chunks"}},
    "embedder": {"inputs": {"chunks": "chunks"}, "outputs": {"vectors": "vectors"}},
    "vector-db": {"inputs": {"vectors": "vectors"}, "outputs": {"index": "index"}},
    "retriever": {"inputs": {"index": "index"}, "outputs": {"context": "context"}},
    "reranker": {"inputs": {"context": "context"}, "outputs": {"reranked-context": "context"}},
    "prompt-template": {"inputs": {"context": "context"}, "outputs": {"prompt": "prompt"}},
    "llm": {"inputs": {"context": "context", "prompt": "prompt"}, "outputs": {"answer": "answer"}},
}


def validate_pipeline(challenge, nodes: list[BuildNode], edges: list[BuildEdge]) -> ValidateBuildResponse:
    allowed_components = set(challenge.supportedComponents)
    required_components = challenge.validationRules.get("requiredCore", CANONICAL_CORE)
    node_labels = [node.label for node in nodes]
    label_counts = Counter(node_labels)
    required_missing = [label for label in required_components if label not in label_counts]
    feedback: list[str] = []
    invalid_edges: list[InvalidEdge] = []

    unsupported = [label for label in node_labels if label not in allowed_components]
    if unsupported:
        feedback.append(f"Unsupported components detected: {', '.join(sorted(set(unsupported)))}.")

    duplicates = [label for label, count in label_counts.items() if count > 1 and label in required_components]
    if duplicates:
        feedback.append(f"Duplicate core components are not allowed: {', '.join(duplicates)}.")

    node_map = {node.id: node for node in nodes}
    adjacency = defaultdict(list)
    indegree = defaultdict(int)
    for edge in edges:
        if edge.source not in node_map or edge.target not in node_map:
            invalid_edges.append(
                InvalidEdge(source=edge.source, target=edge.target, reason="Edge references a missing node.")
            )
            continue
        adjacency[edge.source].append(edge.target)
        indegree[edge.target] += 1
        indegree.setdefault(edge.source, 0)

    if nodes and not _is_single_connected_component(nodes, edges):
        feedback.append("Graph must be connected as one pipeline.")

    detected_order = _topological_labels(nodes, adjacency, indegree)
    label_positions = {label: index for index, label in enumerate(detected_order)}

    def has_order(first: str, second: str) -> bool:
        return first in label_positions and second in label_positions and label_positions[first] < label_positions[second]

    if "Dense Retriever" in label_positions and "FAISS Vector Store" in label_positions and not has_order("FAISS Vector Store", "Dense Retriever"):
        feedback.append("FAISS Vector Store must come before Dense Retriever.")

    if "Embeddings" in label_positions and "FAISS Vector Store" in label_positions and not has_order("Embeddings", "FAISS Vector Store"):
        feedback.append("Embeddings must come before FAISS Vector Store.")

    if "Dense Retriever" in label_positions and "LLM" in label_positions and not has_order("Dense Retriever", "LLM"):
        feedback.append("Dense Retriever must come before LLM.")

    if "Reranker" in label_positions:
        if not ("Dense Retriever" in label_positions and "LLM" in label_positions and has_order("Dense Retriever", "Reranker") and has_order("Reranker", "LLM")):
            feedback.append("Reranker must sit between Dense Retriever and LLM.")

    if "Prompt Template" in label_positions:
        if not ("LLM" in label_positions and has_order("Prompt Template", "LLM")):
            feedback.append("Prompt Template must feed into the LLM stage.")

    for edge in edges:
        if edge.source in node_map and edge.target in node_map:
            source_label = node_map[edge.source].label
            target_label = node_map[edge.target].label
            if source_label == "Dense Retriever" and target_label == "FAISS Vector Store":
                invalid_edges.append(
                    InvalidEdge(source=edge.source, target=edge.target, reason="Dense Retriever cannot feed FAISS Vector Store.")
                )

            if edge.sourceHandle or edge.targetHandle:
                source_def = RAG_HANDLE_TYPES.get(node_map[edge.source].type)
                target_def = RAG_HANDLE_TYPES.get(node_map[edge.target].type)
                source_type = source_def and source_def["outputs"].get(edge.sourceHandle or "")
                target_type = target_def and target_def["inputs"].get(edge.targetHandle or "")
                if not source_type or not target_type or source_type != target_type:
                    invalid_edges.append(
                        InvalidEdge(
                            source=edge.source,
                            target=edge.target,
                            reason="The connected handles carry incompatible data types.",
                        )
                    )

    normalized_pipeline = [label for label in detected_order if label in label_counts]

    is_valid = not required_missing and not unsupported and not duplicates and not feedback and not invalid_edges and len(nodes) >= len(required_components)

    if is_valid:
        feedback.append("Pipeline is valid and ready to simulate.")
        if "Reranker" not in label_counts:
            feedback.append("Optional improvement: add a Reranker for higher answer precision.")
        if "Prompt Template" not in label_counts:
            feedback.append("Optional improvement: add a Prompt Template before the LLM.")
    else:
        if required_missing:
            feedback.insert(0, f"Missing required components: {', '.join(required_missing)}.")

    score_preview = _score_preview(required_missing, invalid_edges, feedback, label_counts)
    return ValidateBuildResponse(
        isValid=is_valid,
        requiredMissingNodes=required_missing,
        invalidEdges=invalid_edges,
        detectedOrder=detected_order,
        scorePreview=score_preview,
        feedback=feedback,
        normalizedPipeline=normalized_pipeline,
    )


def _is_single_connected_component(nodes: list[BuildNode], edges: list[BuildEdge]) -> bool:
    if not nodes:
        return False
    graph = defaultdict(set)
    for node in nodes:
        graph[node.id]
    for edge in edges:
        graph[edge.source].add(edge.target)
        graph[edge.target].add(edge.source)
    visited = set()
    queue = deque([nodes[0].id])
    while queue:
        current = queue.popleft()
        if current in visited:
            continue
        visited.add(current)
        queue.extend(graph[current] - visited)
    return len(visited) == len(nodes)


def _topological_labels(nodes, adjacency, indegree) -> list[str]:
    if not nodes:
        return []
    queue = deque(sorted([node.id for node in nodes if indegree.get(node.id, 0) == 0]))
    order: list[str] = []
    local_indegree = dict(indegree)
    node_map = {node.id: node for node in nodes}
    while queue:
        current = queue.popleft()
        order.append(node_map[current].label)
        for nxt in adjacency.get(current, []):
            local_indegree[nxt] -= 1
            if local_indegree[nxt] == 0:
                queue.append(nxt)
    if len(order) != len(nodes):
        return [node.label for node in nodes]
    return order


def _score_preview(required_missing, invalid_edges, feedback, label_counts) -> int:
    score = 100
    score -= len(required_missing) * 18
    score -= len(invalid_edges) * 10
    if "Reranker" not in label_counts:
        score -= 4
    if "Prompt Template" not in label_counts:
        score -= 4
    blocking_feedback = [item for item in feedback if not item.startswith("Optional improvement")]
    score -= max(0, len(blocking_feedback) - len(required_missing)) * 6
    return max(score, 0)
