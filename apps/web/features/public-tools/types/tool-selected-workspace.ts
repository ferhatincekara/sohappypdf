import type { ToolDefinition } from "@sohappypdf/tools/catalog";
import type { ToolWorkspaceState } from "@/features/public-tools/lib/tool-workspace";
import type { ToolSelectedUxState } from "@/features/public-tools/types/tool-ux-state";

export type ToolSelectedWorkspaceProps = {
  tool: ToolDefinition;
  state: ToolSelectedUxState;
  accept: string;
  multiple: boolean;
  canAddFiles: boolean;
  formatsLabel: string;
  maxSizeLabel: string;
  reorderable: boolean;
  disabled: boolean;
  canProcess: boolean;
  processLabel: string;
  awaitingSignIn?: boolean;
  autoProcess?: boolean;
  maxPagesPerFile?: number | null;
  workspaceState: ToolWorkspaceState;
  setWorkspaceState: (next: ToolWorkspaceState) => void;
  onSelectFiles: (files: FileList | File[]) => void;
  onReplaceFiles: (files: FileList | File[]) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
  onRetryUpload: (id: string) => void;
  onProcess: () => void;
};
