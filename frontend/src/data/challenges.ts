import { Challenge, PlayerProfile } from "../types";

export const playerProfile: PlayerProfile = {
  name: "Architect",
  role: "Systems Explorer",
  level: 12,
  totalXp: 2450,
  score: 920,
  streakDays: 7,
  rank: "AI Architect",
};

export const challenges: Challenge[] = [
  {
    id: "design-whatsapp-001",
    title: "Design WhatsApp for 100M users",
    category: "System Design",
    difficulty: "Medium",
    rewardXp: 150,
    estimatedTime: "8 min",
    summary:
      "Build a resilient messaging backend with reliable delivery, real-time sync, and graceful scale.",
    objectives: [
      "Create a low-latency message path",
      "Handle burst traffic safely",
      "Support delivery confirmation",
    ],
    supportedComponents: [
      "Client",
      "API Gateway",
      "Chat Service",
      "Redis",
      "Queue",
      "Database",
      "Notification Service",
    ],
    hint: "Think about what protects delivery during traffic spikes.",
    stage: 3,
    status: "in-progress",
    outcome: "Shape service boundaries that stay reliable under real scale.",
    workflow: ["Client", "API", "Queue", "Database"],
    tags: ["scalability", "reliability", "distributed systems"],
  },
  {
    id: "university-rag-001",
    title: "Build a RAG assistant for Business Basics",
    category: "RAG",
    difficulty: "Easy",
    rewardXp: 120,
    estimatedTime: "8 min",
    summary:
<<<<<<< HEAD
      "Assemble a PDF-based RAG pipeline that answers business basics questions from the provided knowledge document.",
    problemIntro:
      "A business student asks questions about a Business Basics handbook, but the assistant cannot read the entire PDF for every request. Your task is to design a Retrieval-Augmented Generation pipeline that loads the handbook, breaks it into useful chunks, stores searchable embeddings, retrieves the best evidence, and gives the language model grounded context for its answer.",
    objectives: [
      "Load the business PDF into the pipeline",
      "Split, embed, and index the document",
      "Retrieve relevant context and generate a grounded answer",
    ],
    supportedComponents: [
      "PDF Loader",
      "Recursive Text Splitting",
      "Embeddings",
      "FAISS Vector Store",
      "Dense Retriever",
      "Reranker",
      "Prompt Template",
      "LLM",
    ],
=======
      "Assemble a retrieval pipeline that can answer policy questions from documents with high accuracy.",
    objectives: ["Load documents", "Index embeddings", "Retrieve relevant chunks"],
    supportedComponents: ["PDF Loader", "Chunking", "Embeddings", "Vector DB", "Retriever", "LLM"],
    hint: "Without embeddings, your retriever has nothing meaningful to search.",
>>>>>>> 549e4ce60bde9631539368554ce5da0047e22c36
    stage: 1,
    status: "recommended",
    outcome: "Ground answers in the right context before generation begins.",
    workflow: ["Load", "Embed", "Retrieve", "Answer"],
    tags: ["retrieval", "embeddings", "grounding"],
<<<<<<< HEAD
    hint: "The core path is PDF Loader → Recursive Text Splitting → Embeddings → FAISS Vector Store → Dense Retriever → LLM. Add a Reranker and Prompt Template for a higher score.",
=======
>>>>>>> 549e4ce60bde9631539368554ce5da0047e22c36
  },
  {
    id: "agent-sql-001",
    title: "Build a Text-to-SQL analyst team",
    category: "Agents",
    difficulty: "Medium",
    rewardXp: 140,
    estimatedTime: "7 min",
    summary:
      "Design a multi-agent flow that turns CSV questions into verified SQL and visual answers.",
    objectives: ["Plan analytical intent", "Verify generated SQL", "Explain the result visually"],
    supportedComponents: ["Planner", "Researcher", "Coder", "Tester", "Reviewer"],
    hint: "The tester must verify the generated SQL before the reviewer explains the result.",
    stage: 2,
    status: "new",
    outcome: "Coordinate agents that plan, act, verify, and explain their output.",
    workflow: ["Plan", "Research", "SQL", "Verify"],
    tags: ["orchestration", "SQL", "verification"],
  },
  {
    id: "debug-rag-001",
    title: "Fix a broken legal assistant pipeline",
    category: "Debug",
    difficulty: "Easy",
    rewardXp: 90,
    estimatedTime: "4 min",
    summary:
      "Spot the missing or misplaced component that causes retrieval to fail under real usage.",
    objectives: ["Find the bug", "Repair the flow", "Reduce unnecessary complexity"],
    supportedComponents: ["PDF Loader", "Embeddings", "Vector DB", "Retriever", "LLM"],
    hint: "Look for the first point where semantic meaning should be encoded.",
    stage: 4,
    status: "new",
    outcome: "Find the broken link in a live data flow and repair it with intent.",
    workflow: ["Find", "Inspect", "Repair", "Test"],
    tags: ["diagnostics", "data flow", "repair"],
  },
  {
    id: "optimize-netflix-001",
    title: "Optimize Netflix playback latency",
    category: "Optimize",
    difficulty: "Hard",
    rewardXp: 180,
    estimatedTime: "9 min",
    summary:
      "Reduce buffer time while preserving streaming quality by tuning the serving architecture.",
    objectives: ["Lower latency", "Preserve reliability", "Avoid unnecessary cost"],
    supportedComponents: ["CDN", "Edge Cache", "Object Storage", "Streaming Service", "Compression"],
    hint: "Bring content closer to the user before scaling compute.",
    stage: 5,
    status: "new",
    outcome: "Trade cost, speed, and reliability without breaking the experience.",
    workflow: ["Measure", "Tune", "Compare"],
    tags: ["latency", "cost", "performance"],
  },
];

export const dailyChallenge = challenges[0];

export const challengeCategories = ["All", "RAG", "Agents", "System Design", "Debug", "Optimize"] as const;
