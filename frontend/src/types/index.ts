export type ChallengeCategory =
  | "RAG"
  | "Agents"
  | "System Design"
  | "Debug"
  | "Optimize";

export interface Challenge {
  id: string;
  title: string;
  category: ChallengeCategory;
  difficulty: "Easy" | "Medium" | "Hard";
  rewardXp: number;
  estimatedTime: string;
  summary: string;
  objectives: string[];
  supportedComponents: string[];
  hint: string;
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

export interface ScoringDimension {
  label: string;
  weight: number;
}

export interface ChallengeDetail extends Challenge {
  sampleQueries: string[];
  scoringDimensions: ScoringDimension[];
  validationRules: {
    requiredCore: string[];
    optionalComponents: string[];
    singlePipeline: boolean;
  };
}

export interface ChallengeSummary {
  id: string;
  title: string;
  difficulty: string;
  rewardXp: number;
  estimatedTime: string;
  summary: string;
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
  meta?: Record<string, string | number>;
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
