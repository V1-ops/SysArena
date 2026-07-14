export type ConfigFieldType = "select" | "slider" | "text" | "number" | "toggle";

export interface GameModeConfig {
  id: string;
  label: string;
  theme: {
    background: string;
    gridColor: string;
    nodeColors: Record<string, string>;
    accent: string;
    textPrimary: string;
    textSecondary: string;
    borderRadius: string;
    edgeColor: string;
    edgeAnimatedColor: string;
  };
  nodeRegistry: NodeTypeDef[];
  connectionRules: Record<string, string[]>;
  canvasSettings: {
    gridSize: number;
    snapToGrid: boolean;
    minZoom: number;
    maxZoom: number;
    edgeAnimationSpeed: number;
    defaultNodeSpacing: number;
  };
  challengeMeta: {
    challengeId: string;
    title: string;
    description: string;
    allowedNodeTypeIds: string[];
    hint?: string;
    objectives?: string[];
    sampleQueries?: string[];
    sourceLabel?: string;
    maxNodes?: number;
    timeLimitSeconds?: number;
  };
}

export interface NodeTypeDef {
  id: string;
  label: string;
  category: string;
  description: string;
  icon?: string;
  inputs: HandleDef[];
  outputs: HandleDef[];
  configFields: ConfigFieldDef[];
}

export interface HandleDef {
  id: string;
  label: string;
  dataType: string;
}

export interface ConfigFieldDef {
  name: string;
  label: string;
  type: ConfigFieldType;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  default: unknown;
}
