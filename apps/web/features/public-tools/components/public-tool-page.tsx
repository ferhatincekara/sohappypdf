import type { ToolDefinition } from "@repo/tools/catalog";
import { PublicToolWorkspace } from "./public-tool-workspace";

export function PublicToolPageContent({ tool }: { tool: ToolDefinition }) {
  return <PublicToolWorkspace tool={tool} />;
}
