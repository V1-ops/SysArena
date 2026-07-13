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
