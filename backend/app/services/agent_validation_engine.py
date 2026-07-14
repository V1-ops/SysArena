from collections import defaultdict, deque

from app.schemas.build import BuildEdge, BuildNode, InvalidEdge, ValidateBuildResponse

CANONICAL_AGENT_ORDER = ["Planner", "Researcher", "Coder", "Tester", "Reviewer"]
CANONICAL_AGENT_TYPES = ["planner", "researcher", "coder", "tester", "reviewer"]


def validate_agent_pipeline(nodes: list[BuildNode], edges: list[BuildEdge]) -> ValidateBuildResponse:
    feedback: list[str] = []
    invalid_edges: list[InvalidEdge] = []
    node_map = {node.id: node for node in nodes}
    counts = defaultdict(int)
    for node in nodes:
        counts[node.type] += 1

    missing = [label for label, node_type in zip(CANONICAL_AGENT_ORDER, CANONICAL_AGENT_TYPES) if counts[node_type] == 0]
    unsupported = [node.label for node in nodes if node.type not in CANONICAL_AGENT_TYPES]
    duplicates = [label for label, node_type in zip(CANONICAL_AGENT_ORDER, CANONICAL_AGENT_TYPES) if counts[node_type] > 1]

    if missing:
        feedback.append(f"Missing required agents: {', '.join(missing)}.")
    if unsupported:
        feedback.append(f"Unsupported agents detected: {', '.join(sorted(set(unsupported)))}.")
    if duplicates:
        feedback.append(f"Duplicate agents are not allowed: {', '.join(duplicates)}.")

    adjacency: dict[str, list[str]] = defaultdict(list)
    indegree: dict[str, int] = {node.id: 0 for node in nodes}
    for edge in edges:
        if edge.source not in node_map or edge.target not in node_map:
            invalid_edges.append(InvalidEdge(source=edge.source, target=edge.target, reason="Edge references a missing node."))
            continue
        adjacency[edge.source].append(edge.target)
        indegree[edge.target] += 1

    if nodes and not _is_connected(nodes, edges):
        feedback.append("All five agents must be connected as one pipeline.")

    detected_order = _topological_labels(nodes, adjacency, indegree)
    if detected_order != CANONICAL_AGENT_ORDER and not missing and not unsupported and not duplicates:
        feedback.append("Agents must run in the order Planner → Researcher → Coder → Tester → Reviewer.")

    expected_pairs = list(zip(CANONICAL_AGENT_TYPES, CANONICAL_AGENT_TYPES[1:]))
    actual_pairs = {
        (node_map[edge.source].type, node_map[edge.target].type)
        for edge in edges
        if edge.source in node_map and edge.target in node_map
    }
    if not missing and not unsupported and not duplicates:
        for source_type, target_type in expected_pairs:
            if (source_type, target_type) not in actual_pairs:
                feedback.append(f"Connect {source_type.title()} to {target_type.title()}.")
        if len(edges) > 4:
            feedback.append("Remove unnecessary hops; the scored workflow has four edges.")

    normalized = [label for label in CANONICAL_AGENT_ORDER if label in detected_order]
    is_valid = not missing and not unsupported and not duplicates and not invalid_edges and not feedback and len(nodes) == 5 and len(edges) == 4
    if is_valid:
        feedback.append("Agent workflow is valid and ready to execute.")

    score = 100
    score -= len(missing) * 20
    score -= len(unsupported) * 15
    score -= len(duplicates) * 12
    score -= len(invalid_edges) * 10
    score -= max(0, len(feedback) - len(missing)) * 6
    return ValidateBuildResponse(
        isValid=is_valid,
        requiredMissingNodes=missing,
        invalidEdges=invalid_edges,
        detectedOrder=detected_order,
        scorePreview=max(score, 0),
        feedback=feedback,
        normalizedPipeline=normalized,
    )


def _is_connected(nodes: list[BuildNode], edges: list[BuildEdge]) -> bool:
    graph: dict[str, set[str]] = defaultdict(set)
    for node in nodes:
        graph[node.id]
    for edge in edges:
        graph[edge.source].add(edge.target)
        graph[edge.target].add(edge.source)
    visited: set[str] = set()
    queue = deque([nodes[0].id])
    while queue:
        current = queue.popleft()
        if current in visited:
            continue
        visited.add(current)
        queue.extend(graph[current] - visited)
    return len(visited) == len(nodes)


def _topological_labels(nodes: list[BuildNode], adjacency: dict[str, list[str]], indegree: dict[str, int]) -> list[str]:
    node_map = {node.id: node for node in nodes}
    queue = deque(node.id for node in nodes if indegree.get(node.id, 0) == 0)
    order: list[str] = []
    local_indegree = dict(indegree)
    while queue:
        current = queue.popleft()
        order.append(node_map[current].label)
        for target in adjacency.get(current, []):
            local_indegree[target] -= 1
            if local_indegree[target] == 0:
                queue.append(target)
    return order if len(order) == len(nodes) else [node.label for node in nodes]
