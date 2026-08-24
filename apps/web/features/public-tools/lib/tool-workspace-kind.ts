export const CONVERT_TOOL_IDS = [
  "pdf-to-word",
  "pdf-to-word-ocr",
  "pdf-to-excel",
  "pdf-to-excel-ocr",
  "pdf-to-powerpoint",
  "word-to-pdf",
  "excel-to-pdf",
  "powerpoint-to-pdf",
  "office-to-pdf",
  "pdf-to-jpg",
  "pdf-to-png",
  "pdf-to-txt",
  "jpg-to-pdf",
  "png-to-pdf",
  "pdf-to-markdown",
  "pdf-to-pdfa",
] as const;

export type ConvertToolId = (typeof CONVERT_TOOL_IDS)[number];

export const TOOL_WORKSPACE_KINDS = [
  "split",
  "extract",
  "organize",
  "merge",
  "rotate",
  "remove",
  "compress",
  "convert",
  "imageToPdf",
  "protect",
  "unlock",
  "repair",
  "ocr",
  "default",
] as const;

export type ToolWorkspaceKind = (typeof TOOL_WORKSPACE_KINDS)[number];

export const IMAGE_TO_PDF_TOOL_IDS = ["jpg-to-pdf", "png-to-pdf"] as const;

export function isImageToPdfToolId(toolId: string): boolean {
  return IMAGE_TO_PDF_TOOL_IDS.some((id) => id === toolId);
}

export function isConvertToolId(toolId: string): toolId is ConvertToolId {
  return CONVERT_TOOL_IDS.some((id) => id === toolId);
}

export function resolveToolWorkspaceKind(toolId: string): ToolWorkspaceKind {
  if (toolId === "split-pdf") {
    return "split";
  }

  if (toolId === "extract-pages") {
    return "extract";
  }

  if (toolId === "organize-pdf") {
    return "organize";
  }

  if (toolId === "merge-pdf") {
    return "merge";
  }

  if (toolId === "rotate-pdf") {
    return "rotate";
  }

  if (toolId === "remove-pages") {
    return "remove";
  }

  if (toolId === "compress-pdf") {
    return "compress";
  }

  if (toolId === "protect-pdf") {
    return "protect";
  }

  if (toolId === "unlock-pdf") {
    return "unlock";
  }

  if (toolId === "repair-pdf") {
    return "repair";
  }

  if (toolId === "ocr-pdf") {
    return "ocr";
  }

  if (isImageToPdfToolId(toolId)) {
    return "imageToPdf";
  }

  if (isConvertToolId(toolId)) {
    return "convert";
  }

  return "default";
}
