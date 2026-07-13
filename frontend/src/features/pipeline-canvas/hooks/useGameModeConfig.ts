import { gameModeConfigs, type GameModeId } from "../config";

export function useGameModeConfig(activeId: GameModeId) {
  return gameModeConfigs.find((config) => config.id === activeId) ?? gameModeConfigs[0];
}
