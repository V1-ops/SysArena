export type ChallengeCategory =
  | "RAG"
  | "Agents"
  | "System Design"
  | "Debug"
  | "Optimize";

export interface ChallengeSummary {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  rewardXp: number;
  estimatedTime: string;
  summary: string;
}

export interface ScoringDimension {
  label: string;
  weight: number;
}

export interface Challenge extends ChallengeSummary {
  category: ChallengeCategory | string;
  objectives: string[];
  supportedComponents: string[];
  hint: string;
}

export interface ChallengeDetail extends Challenge {
  sampleQueries: string[];
  scoringDimensions: ScoringDimension[];
  validationRules: {
    requiredCore?: string[];
    optionalComponents?: string[];
    singlePipeline?: boolean;
  };
}

export interface PlayerProfile {
  name: string;
  role: string;
  level: number;
  totalXp: number;
  score: number;
  streakDays: number;
  rank: string;
}

export interface BuildNode {
  id: string;
  type: string;
  label: string;
}

export interface BuildEdge {
  source: string;
  target: string;
}

export interface AgentDatasetColumn {
  name: string;
  type: string;
}

export interface AgentDataset {
  id: string;
  name: string;
  file?: string;
  description: string;
  rowCount: number;
  sampleQueries: string[];
  columns: AgentDatasetColumn[];
  metricAliases?: Record<string, string>;
}

export interface AgentChart {
  type: "bar" | "line" | "pie" | "metric" | string;
  title: string;
  xKey?: string | null;
  yKey?: string | null;
}

export interface AgentRunResponse {
  runId: string;
  status: string;
  answer: string;
  sql: string;
  dataset: AgentDataset;
  schema: Array<{ name: string; type: string }>;
  result: {
    columns: string[];
    rows: Array<Record<string, string | number | null>>;
  };
  chart: AgentChart;
  simulationTimeline: Array<{
    id: string;
    type: string;
    label: string;
    status: string;
    startedAtOffsetMs: number;
    durationMs: number;
    meta?: Record<string, unknown>;
  }>;
  transcript: Array<{
    agent: string;
    status: string;
    message: string;
    meta?: Record<string, unknown>;
  }>;
  metrics: {
    latencyMs: number;
    retryCount: number;
    rowCount: number;
    estimatedCost: string;
  };
  scoreBreakdown: Array<{ label: string; score: number; maxScore: number }>;
  judgeFeedback: {
    positive: string;
    weakness: string;
    nextStep: string;
    recommendations: string[];
  };
  planArtifact: Record<string, unknown>;
  researchArtifact: Record<string, unknown>;
  sqlArtifact: Record<string, unknown>;
  verificationArtifact: Record<string, unknown>;
  reviewArtifact: Record<string, unknown>;
}

export interface InvalidEdge {
  source: string;
  target: string;
  reason: string;
}

export interface ValidateBuildResponse {
  isValid: boolean;
  requiredMissingNodes: string[];
  invalidEdges: InvalidEdge[];
  detectedOrder: string[];
  scorePreview: number;
  feedback: string[];
  normalizedPipeline: string[];
}

export interface RetrievedChunk {
  chunkId: string;
  text: string;
  score: number;
}

export interface SimulationEvent {
  id: string;
  type: string;
  label: string;
  status: string;
  startedAtOffsetMs: number;
  durationMs: number;
  meta?: Record<string, unknown> | null;
}

export interface ScoreBreakdown {
  label: string;
  score: number;
  maxScore: number;
}

export interface JudgeFeedback {
  positive: string;
  weakness: string;
  nextStep: string;
  recommendations: string[];
}

export interface RagMetrics {
  latencyMs: number;
  retrievedChunkCount: number;
  topK: number;
  contextChars: number;
  estimatedCost: string;
}

export interface RagRunResponse {
  runId: string;
  status: string;
  answer: string;
  retrievedChunks: RetrievedChunk[];
  metrics: RagMetrics;
  simulationTimeline: SimulationEvent[];
  scoreBreakdown: ScoreBreakdown[];
  judgeFeedback: JudgeFeedback;
}
