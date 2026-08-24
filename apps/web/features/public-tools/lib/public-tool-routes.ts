import { listRegisteredTools } from "@repo/tools/catalog";

export function listPublicToolRouteParams(): readonly { toolId: string }[] {
  return listRegisteredTools().map((tool) => ({ toolId: tool.id }));
}
