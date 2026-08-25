import { listRegisteredTools } from "@repo/tools/catalog";

export type PublicApiTool = {
  id: string;
  apiCreditCost: number;
};

export function listPublicApiTools(): readonly PublicApiTool[] {
  return listRegisteredTools().map((tool) => ({
    id: tool.id,
    apiCreditCost: tool.apiCreditCost,
  }));
}
