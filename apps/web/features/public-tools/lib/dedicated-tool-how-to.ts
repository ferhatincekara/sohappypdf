export type DedicatedHowToWorkspace =
  | "split"
  | "organize"
  | "merge"
  | "rotate"
  | "remove";

export type DedicatedHowTo = {
  workspace: DedicatedHowToWorkspace;
  steps: readonly string[];
};

const DEDICATED_HOW_TO: Record<string, DedicatedHowTo> = {
  "split-pdf": {
    workspace: "split",
    steps: ["upload", "select", "download"],
  },
  "organize-pdf": {
    workspace: "organize",
    steps: ["upload", "arrange", "download"],
  },
  "merge-pdf": {
    workspace: "merge",
    steps: ["upload", "arrange", "download"],
  },
  "rotate-pdf": {
    workspace: "rotate",
    steps: ["upload", "select", "download"],
  },
  "remove-pages": {
    workspace: "remove",
    steps: ["upload", "select", "download"],
  },
};

export function dedicatedHowToForTool(toolId: string): DedicatedHowTo | null {
  return DEDICATED_HOW_TO[toolId] ?? null;
}
