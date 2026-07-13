import type { SubmitPipelinePayload, SubmitPipelineResponse } from "../types/graph.types";

const nodeWorkByType: Record<string, { active: string; completed: string }> = {
  "pdf-loader": {
    active: "Reading uploaded document and preparing raw text.",
    completed: "Document text loaded into the pipeline.",
  },
  chunker: {
    active: "Splitting document text into overlapping chunks.",
    completed: "Chunks created for retrieval.",
  },
  embedder: {
    active: "Generating embeddings for each chunk.",
    completed: "Chunk vectors generated.",
  },
  "vector-db": {
    active: "Indexing vectors for similarity search.",
    completed: "Vector index is ready.",
  },
  retriever: {
    active: "Searching for context that matches the query.",
    completed: "Relevant context selected.",
  },
  llm: {
    active: "Combining retrieved context with the query.",
    completed: "Grounded answer generated.",
  },
  client: {
    active: "Issuing user request into the system.",
    completed: "Request accepted.",
  },
  "api-gateway": {
    active: "Routing request and applying gateway policies.",
    completed: "Request routed to service layer.",
  },
  "chat-service": {
    active: "Processing message and coordinating persistence.",
    completed: "Message processing complete.",
  },
  queue: {
    active: "Buffering work for reliable downstream handling.",
    completed: "Queued work delivered.",
  },
  database: {
    active: "Persisting durable state.",
    completed: "State persisted.",
  },
  "notification-service": {
    active: "Preparing delivery notifications.",
    completed: "Notifications dispatched.",
  },
  planner: {
    active: "Breaking the mission into ordered steps.",
    completed: "Execution plan prepared.",
  },
  researcher: {
    active: "Gathering source context for the plan.",
    completed: "Research findings collected.",
  },
  coder: {
    active: "Applying implementation changes.",
    completed: "Patch produced.",
  },
  tester: {
    active: "Running verification checks.",
    completed: "Test report generated.",
  },
  reviewer: {
    active: "Reviewing output quality for delivery.",
    completed: "Final answer approved.",
  },
};

function orderedNodes(payload: SubmitPipelinePayload) {
  const nodes = payload.graph.nodes;
  const edges = payload.graph.edges;
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();

  for (const edge of edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }

  const queue = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  const visited = new Set<string>();
  const result = [];

  while (queue.length) {
    const node = queue.shift()!;
    if (visited.has(node.id)) continue;
    visited.add(node.id);
    result.push(node);

    for (const targetId of outgoing.get(node.id) ?? []) {
      incoming.set(targetId, (incoming.get(targetId) ?? 1) - 1);
      if ((incoming.get(targetId) ?? 0) === 0) {
        const targetNode = nodes.find((item) => item.id === targetId);
        if (targetNode) queue.push(targetNode);
      }
    }
  }

  return result.length ? result : nodes;
}

function buildFakeTrace(payload: SubmitPipelinePayload) {
  return orderedNodes(payload).map((node, index) => {
    const work = nodeWorkByType[node.type] ?? {
      active: `Running ${node.type}.`,
      completed: `${node.type} completed.`,
    };
    const querySuffix = payload.gameModeId === "rag-builder" && payload.input?.query
      ? ` Query: "${payload.input.query}"`
      : "";
    return {
    nodeId: node.id,
    status: "success" as const,
      timestampMs: index * 800,
      durationMs: 800,
      activeMessage: `${work.active}${querySuffix}`,
      completedMessage: work.completed,
    };
  });
}

export async function submitPipeline(payload: SubmitPipelinePayload): Promise<SubmitPipelineResponse> {
  const apiBase = import.meta.env.VITE_CANVAS_API_BASE as string | undefined;

  if (apiBase) {
    const response = await fetch(`${apiBase}/api/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Submit failed with ${response.status}`);
    }

    return response.json() as Promise<SubmitPipelineResponse>;
  }

  await new Promise((resolve) => window.setTimeout(resolve, 450));

  return {
    submissionId: `local-${Date.now()}`,
    status: "completed",
    score: {
      overall: 0.84,
      metrics: {
        correctness: 0.88,
        latency: 0.76,
        reliability: 0.9,
      },
    },
    trace: buildFakeTrace(payload),
    leaderboardRank: 3,
  };
}
