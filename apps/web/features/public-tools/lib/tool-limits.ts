import { resolveWebMaxFilesPerOperation } from "@sohappypdf/billing/plans";
import {
  type ToolDefinition,
  toolCombinesSourceFiles,
  toolSupportsBatchOperations,
} from "@sohappypdf/tools/catalog";

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
  input: {
    anonymous: boolean;
    maxFilesPerOperation?: number | null;
    plan?: "free" | "pro";
  },
): number {
  return resolveWebMaxFilesPerOperation({
    isAuthenticated: !input.anonymous,
    toolMaxInputCount: tool.maxInputCount,
    planMaxFilesPerOperation:
      input.plan === "pro" ? null : input.maxFilesPerOperation,
    combinesSourceFiles: toolCombinesSourceFiles(tool.id),
    supportsBatch: toolSupportsBatchOperations(tool.id),
  });
}
