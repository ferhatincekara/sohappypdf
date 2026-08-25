import { resolveToolWorkspaceKind } from "./tool-workspace-kind";

const DEFAULT_WORKSPACE_OPTION_TOOL_IDS = [
  "reorder-pages",
  "page-numbers-pdf",
  "ai-summarizer",
  "translate-pdf",
] as const;

export function toolRequiresConfiguration(toolId: string): boolean {
  const kind = resolveToolWorkspaceKind(toolId);

  if (kind === "repair" || kind === "convert" || kind === "imageToPdf") {
    return false;
  }

  if (kind === "default") {
    return DEFAULT_WORKSPACE_OPTION_TOOL_IDS.some((id) => id === toolId);
  }

  return true;
}
