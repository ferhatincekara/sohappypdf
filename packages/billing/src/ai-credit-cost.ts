import { getRegisteredTool, isRegisteredToolId } from "@repo/tools";

export function resolveAiCreditCost(toolId: string): number {
  if (!isRegisteredToolId(toolId)) {
    return 0;
  }

  return getRegisteredTool(toolId).aiCreditCost;
}

export function usesAiCredits(toolId: string): boolean {
  return resolveAiCreditCost(toolId) > 0;
}
