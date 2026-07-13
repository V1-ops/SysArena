import { agentBuilderConfig } from "./agentBuilderConfig";
import { ragBuilderConfig } from "./ragBuilderConfig";
import { systemDesignConfig } from "./systemDesignConfig";

export const gameModeConfigs = [ragBuilderConfig, systemDesignConfig, agentBuilderConfig] as const;

export type GameModeId = (typeof gameModeConfigs)[number]["id"];
