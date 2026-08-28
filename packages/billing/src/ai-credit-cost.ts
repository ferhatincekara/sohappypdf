import { findCatalogTool } from "@repo/tools";

export function resolveAiCreditCost(toolId: string): number {
  return findCatalogTool(toolId)?.aiCreditCost ?? 0;
}

export function usesAiCredits(toolId: string): boolean {
  return resolveAiCreditCost(toolId) > 0;
}
