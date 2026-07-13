import type { NodeTypeDef } from "../../types/config.types";

export function getDefaultValues(nodeDef: NodeTypeDef): Record<string, unknown> {
  return Object.fromEntries(nodeDef.configFields.map((field) => [field.name, field.default]));
}
