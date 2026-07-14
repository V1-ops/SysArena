export type HomeLoopStage = {
  id: "observe" | "build" | "simulate" | "verify" | "understand";
  label: string;
  eyebrow: string;
  description: string;
};

export const homeProofMetrics = [
  { value: "05", label: "Engineering modes" },
  { value: "∞", label: "Visual workflows" },
  { value: "01", label: "Learning loop" },
];

export const homeLoopStages: HomeLoopStage[] = [
  {
    id: "observe",
    label: "Observe",
    eyebrow: "Start with a question",
    description: "Turn a real engineering problem into a focused mission you can reason about.",
  },
  {
    id: "build",
    label: "Build",
    eyebrow: "Compose the workflow",
    description: "Connect understandable components and agents so the system has a visible shape.",
  },
  {
    id: "simulate",
    label: "Simulate",
    eyebrow: "Watch the system run",
    description: "Follow data and decisions as they move through the workflow one step at a time.",
  },
  {
    id: "verify",
    label: "Verify",
    eyebrow: "Trust the result",
    description: "Use tests, checks, and feedback to separate a working idea from a reliable system.",
  },
  {
    id: "understand",
    label: "Understand",
    eyebrow: "Learn from the output",
    description: "See the final artifact, the score, and the next improvement worth making.",
  },
];

export const learningPath = [
  {
    number: "01",
    icon: "database",
    title: "RAG Builder",
    outcome: "Ground answers in the right context.",
    challengeId: "university-rag-001",
    difficulty: "Easy",
    time: "6 min",
  },
  {
    number: "02",
    icon: "agents",
    title: "Agent Architect",
    outcome: "Coordinate agents that plan, act, and verify.",
    challengeId: "agent-sql-001",
    difficulty: "Medium",
    time: "7 min",
  },
  {
    number: "03",
    icon: "network",
    title: "System Design",
    outcome: "Shape services that survive real scale.",
    challengeId: "design-whatsapp-001",
    difficulty: "Medium",
    time: "8 min",
  },
  {
    number: "04",
    icon: "debug",
    title: "Debug Challenge",
    outcome: "Find the broken link in a live data flow.",
    challengeId: "debug-rag-001",
    difficulty: "Easy",
    time: "4 min",
  },
  {
    number: "05",
    icon: "optimize",
    title: "Optimizer",
    outcome: "Trade cost, speed, and reliability with intent.",
    challengeId: "optimize-netflix-001",
    difficulty: "Hard",
    time: "9 min",
  },
] as const;

export const homeAgentPreview = {
  question: "What were total sales by category?",
  dataset: "Retail Sales",
  sql: 'SELECT "category", SUM("units_sold" * "unit_price") AS revenue\nFROM dataset\nGROUP BY "category"\nORDER BY revenue DESC;',
  result: "Electronics  ·  $1,211",
  takeaway: "The workflow turns a plain-language question into a verified analytical artifact.",
};
