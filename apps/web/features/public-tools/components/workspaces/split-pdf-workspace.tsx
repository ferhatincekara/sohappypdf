"use client";

import type { ToolSelectedWorkspaceProps } from "../../types/tool-selected-workspace";
import { KeepSelectedPagesWorkspace } from "./keep-selected-pages-workspace";

export function SplitPdfWorkspace(props: ToolSelectedWorkspaceProps) {
  return <KeepSelectedPagesWorkspace {...props} copy="split" />;
}
