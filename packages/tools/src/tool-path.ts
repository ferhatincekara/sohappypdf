import type { ToolId } from "./tool-id.js";

export function toolPublicPath(toolId: ToolId): `/${ToolId}` {
  return `/${toolId}`;
}
