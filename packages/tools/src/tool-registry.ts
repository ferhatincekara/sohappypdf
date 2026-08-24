import { APP_ERROR_CODES, AppError } from "@repo/core";
import { findCatalogTool, findRegisteredTool } from "./public-catalog.js";
import type { ToolDefinition } from "./tool-definition.js";
import type { ToolId } from "./tool-id.js";
import { isToolId } from "./tool-id.js";

export {
  findCatalogTool,
  findRegisteredTool,
  groupCatalogToolsByCategory,
  isAnonymousToolAllowed,
  isExecutableTool,
  listCatalogTools,
  listRegisteredTools,
  TOOL_CATALOG,
} from "./public-catalog.js";

export function isRegisteredToolId(value: string): value is ToolId {
  return isToolId(value) && findRegisteredTool(value) !== undefined;
}

export function getRegisteredTool(id: ToolId): ToolDefinition {
  const tool = findRegisteredTool(id);

  if (tool === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "Unknown tool",
    });
  }

  return tool;
}

export function getCatalogTool(id: ToolId): ToolDefinition {
  const tool = findCatalogTool(id);

  if (tool === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.NOT_FOUND,
      message: "Unknown tool",
    });
  }

  return tool;
}
