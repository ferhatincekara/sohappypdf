import { getRegisteredTool, isRegisteredToolId } from "@sohappypdf/tools";

export function resolveWebCreditCost(toolId: string): number {
  if (!isRegisteredToolId(toolId)) {
    return 1;
  }

  return getRegisteredTool(toolId).webCreditCost;
}
