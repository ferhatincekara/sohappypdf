import { isConvertToolId, isImageToPdfToolId } from "./tool-workspace-kind";

export type DedicatedHowToWorkspace =
  | "split"
  | "extract"
  | "organize"
  | "merge"
  | "rotate"
  | "remove"
  | "compress"
  | "convert"
  | "imageToPdf"
  | "repair"
  | "ocr"
  | "protect"
  | "unlock"
  | "watermark"
  | "crop"
  | "sign"
  | "fill";

export type DedicatedHowTo = {
  workspace: DedicatedHowToWorkspace;
  steps: readonly string[];
};

const DEDICATED_HOW_TO: Record<string, DedicatedHowTo> = {
  "split-pdf": {
    workspace: "split",
    steps: ["upload", "select", "download"],
  },
  "extract-pages": {
    workspace: "extract",
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
  "compress-pdf": {
    workspace: "compress",
    steps: ["upload", "select", "download"],
  },
  "repair-pdf": {
    workspace: "repair",
    steps: ["upload", "repair", "download"],
  },
  "ocr-pdf": {
    workspace: "ocr",
    steps: ["upload", "recognize", "download"],
  },
  "protect-pdf": {
    workspace: "protect",
    steps: ["upload", "password", "download"],
  },
  "unlock-pdf": {
    workspace: "unlock",
    steps: ["upload", "password", "download"],
  },
  "watermark-pdf": {
    workspace: "watermark",
    steps: ["upload", "mark", "download"],
  },
  "crop-pdf": {
    workspace: "crop",
    steps: ["upload", "crop", "download"],
  },
  "sign-pdf": {
    workspace: "sign",
    steps: ["upload", "sign", "download"],
  },
  "pdf-forms": {
    workspace: "fill",
    steps: ["upload", "fill", "download"],
  },
};

export function dedicatedHowToForTool(toolId: string): DedicatedHowTo | null {
  const dedicated = DEDICATED_HOW_TO[toolId];

  if (dedicated !== undefined) {
    return dedicated;
  }

  if (isImageToPdfToolId(toolId)) {
    return {
      workspace: "imageToPdf",
      steps: ["upload", "convert", "download"],
    };
  }

  if (isConvertToolId(toolId)) {
    return {
      workspace: "convert",
      steps: ["upload", "convert", "download"],
    };
  }

  return null;
}
