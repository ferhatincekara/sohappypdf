"use client";

import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { KeepSelectedPagesWorkspace } from "./keep-selected-pages-workspace";

export function ExtractPagesWorkspace(props: ToolSelectedWorkspaceProps) {
  return <KeepSelectedPagesWorkspace {...props} copy="extract" />;
}
