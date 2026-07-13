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
  },
  {
    id: "university-rag-001",
    title: "Build a RAG assistant for Business Basics",
    category: "RAG",
    difficulty: "Easy",
    rewardXp: 120,
    estimatedTime: "8 min",
    summary:
      "Assemble a PDF-based RAG pipeline for business basics using recursive chunking, Gemini embeddings, FAISS retrieval, reranking, and structured generation.",
    objectives: ["Load the PDF", "Index embeddings in FAISS", "Retrieve and rerank relevant chunks"],
    supportedComponents: ["PDF Loader", "Recursive Text Splitting", "Embeddings", "FAISS Vector Store", "Dense Retriever", "Reranker", "Prompt Template", "LLM"],
    hint: "Recursive splitting plus dense retrieval is the foundation of this business RAG flow.",
  },
  {
    id: "agent-coder-001",
    title: "Architect an autonomous coding assistant",
    category: "Agents",
    difficulty: "Medium",
    rewardXp: 140,
    estimatedTime: "7 min",
    summary:
      "Design a multi-agent flow that plans, codes, tests, and reviews before shipping an answer.",
    objectives: ["Order agents correctly", "Keep reasoning clear", "Reduce unnecessary hops"],
    supportedComponents: ["Planner", "Researcher", "Coder", "Tester", "Reviewer"],
    hint: "The planner should frame the mission before execution agents begin.",
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
  },
];

export const dailyChallenge = challenges[0];

export const challengeCategories = ["All", "RAG", "Agents", "System Design", "Debug", "Optimize"] as const;
