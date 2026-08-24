import {
  type ToolId as CatalogToolId,
  TOOL_CATALOG,
} from "./public-catalog.js";

export type ToolId = CatalogToolId;

export const TOOL_IDS = TOOL_CATALOG.map(
  (tool) => tool.id,
) as unknown as readonly [ToolId, ...ToolId[]];

export function isToolId(value: string): value is ToolId {
  return TOOL_CATALOG.some((tool) => tool.id === value);
}
