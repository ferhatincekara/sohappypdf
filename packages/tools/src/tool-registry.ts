import { APP_ERROR_CODES, AppError } from "@repo/core";
import { findRegisteredTool, type ToolDefinition } from "./public-catalog.js";
import type { ToolId } from "./tool-id.js";
import { isToolId } from "./tool-id.js";

export {
  findRegisteredTool,
  isAnonymousToolAllowed,
  listRegisteredTools,
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
