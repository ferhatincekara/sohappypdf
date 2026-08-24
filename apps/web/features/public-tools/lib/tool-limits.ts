import type { ToolDefinition } from "@repo/tools/catalog";
import { PUBLIC_ANONYMOUS_MAX_FILES_PER_OPERATION } from "./anonymous-limits";

export function acceptForTool(tool: ToolDefinition): string {
  return tool.inputFormats
    .map((format) => {
      if (format === "pdf") {
        return "application/pdf,.pdf";
      }

      if (format === "jpg") {
        return "image/jpeg,.jpg,.jpeg";
      }

      if (format === "png") {
        return "image/png,.png";
      }

      return `.${format}`;
    })
    .join(",");
}

export function maxFilesForTool(
  tool: ToolDefinition,
  anonymous: boolean,
): number {
  if (!anonymous) {
    return tool.maxInputCount;
  }

  return Math.min(tool.maxInputCount, PUBLIC_ANONYMOUS_MAX_FILES_PER_OPERATION);
}
