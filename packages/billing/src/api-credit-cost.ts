import { getRegisteredTool, isRegisteredToolId } from "@sohappypdf/tools";
import { usesAiCredits } from "./ai-credit-cost.js";

export function resolveApiCreditCost(toolId: string): number {
  if (!isRegisteredToolId(toolId)) {
    return 1;
  }

  return getRegisteredTool(toolId).apiCreditCost;
}

export function usesApiCredits(toolId: string): boolean {
  return !usesAiCredits(toolId) && resolveApiCreditCost(toolId) > 0;
}
