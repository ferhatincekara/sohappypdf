"use client";

import { RemovePagesWorkspace } from "@/features/public-tools/components/workspaces/remove-pages-workspace";
import type { ToolSelectedWorkspaceProps } from "@/features/public-tools/types/tool-selected-workspace";

export function ExtractPagesWorkspace(props: ToolSelectedWorkspaceProps) {
  return <RemovePagesWorkspace {...props} copy="extract" />;
}
