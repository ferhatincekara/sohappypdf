import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import {
  findCatalogTool,
  findRegisteredTool,
  isExecutableTool,
  TOOL_REQUIRES_PRO_MESSAGE,
} from "./public-catalog.js";
import type { ToolDefinition } from "./tool-definition.js";
import type { ToolId } from "./tool-id.js";
import { isToolId } from "./tool-id.js";
import type { ToolPlanId } from "./tool-plan.js";

export {
  findCatalogTool,
  findRegisteredTool,
  groupCatalogToolsByCategory,
  isAnonymousToolAllowed,
  isExecutableTool,
  isPremiumTool,
  listCatalogTools,
  listRegisteredTools,
  TOOL_CATALOG,
  TOOL_REQUIRES_PRO_MESSAGE,
  toolCombinesSourceFiles,
  toolSupportsBatchOperations,
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

export function assertToolAllowedOnPlan(
  toolId: string,
  plan: ToolPlanId,
): void {
  const tool = findCatalogTool(toolId);

  if (tool === undefined || !isExecutableTool(tool)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Unsupported conversion",
    });
  }

  if (!tool.availableOnPlans.includes(plan)) {
    throw new AppError({
      code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
      message: TOOL_REQUIRES_PRO_MESSAGE,
    });
  }
}
