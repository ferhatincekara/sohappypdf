"use client";

import { KeepSelectedPagesWorkspace } from "@/features/public-tools/components/workspaces/keep-selected-pages-workspace";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

export function SplitPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  return <KeepSelectedPagesWorkspace {...props} copy="split" />;
}
