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
  problemIntro?: string;
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
  values?: Record<string, unknown>;
}

export interface BuildEdge {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
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
  nodeId?: string | null;
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
  chunkSize: number;
  chunkOverlap: number;
  rerankerUsed: boolean;
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
  pipelineValid?: boolean;
  validationFeedback?: string[];
}
