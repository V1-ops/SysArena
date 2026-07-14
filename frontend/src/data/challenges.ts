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
    id: "optimizer-gradient-001",
    title: "Optimizer Dojo: Find the Minimum",
    category: "Optimize",
    difficulty: "Easy",
    rewardXp: 160,
    estimatedTime: "5 min",
    summary: "Tune a learning rate and guide gradient descent to the global minimum without overshooting.",
    objectives: ["Understand gradient descent steps", "Compare manual and grid search", "Choose a stable learning rate"],
    supportedComponents: ["Learning Rate", "Manual Search", "Grid Search", "Gradient Descent"],
    hint: "Small steps are safe but slow; large steps can jump past the minimum.",
  },
  {
    id: "physics-optimizer-001",
    title: "Physics Optimizer: Launch the Best Schedule",
    category: "Optimize",
    difficulty: "Medium",
    rewardXp: 190,
    estimatedTime: "6 min",
    summary: "Use dynamic learning-rate formulas to launch a 22-feature model into its target zone.",
    objectives: ["Compare constant, 1/n, and 1/2ⁿ schedules", "Map the two salient weights to motion", "Avoid divergence and premature convergence"],
    supportedComponents: ["22 Model Weights", "Fixed Launch Angle", "Constant LR", "1/n", "1/2ⁿ"],
    hint: "Only two important weights are visible in the flight; the other twenty keep learning in the background.",
  },
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
    title: "Build a RAG assistant for a university handbook",
    category: "RAG",
    difficulty: "Easy",
    rewardXp: 120,
    estimatedTime: "6 min",
    summary:
      "Assemble a retrieval pipeline that can answer policy questions from documents with high accuracy.",
    objectives: ["Load documents", "Index embeddings", "Retrieve relevant chunks"],
    supportedComponents: ["PDF Loader", "Chunking", "Embeddings", "Vector DB", "Retriever", "LLM"],
    hint: "Without embeddings, your retriever has nothing meaningful to search.",
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
