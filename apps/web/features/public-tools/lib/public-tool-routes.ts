import { listRegisteredTools } from "@sohappypdf/tools/catalog";

export function listPublicToolRouteParams(): readonly { toolId: string }[] {
  return listRegisteredTools().map((tool) => ({ toolId: tool.id }));
}
