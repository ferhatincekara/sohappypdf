import {
  CONVERSION_TYPES,
  type ConversionType,
} from "@/features/conversions/types/conversion";
import type { PublicToolErrorKey } from "./public-tool-errors";
import {
  areWorkspaceFilesReady,
  hasUploadingWorkspaceFiles,
  type WorkspaceFile,
} from "./workspace-files";

const TOOLS_REQUIRING_OPTIONS = new Set([
  "split-pdf",
  "extract-pages",
  "organize-pdf",
  "reorder-pages",
  "remove-pages",
  "rotate-pdf",
  "watermark-pdf",
  "protect-pdf",
  "unlock-pdf",
  "sign-pdf",
  "edit-pdf",
]);

export function isToolConversionType(value: string): value is ConversionType {
  return CONVERSION_TYPES.some((type) => type === value);
}

export type ToolProcessValidation =
  | { ok: true }
  | { ok: false; errorKey: PublicToolErrorKey }
  | { ok: false; reason: "uploading" | "notReady" };

export function validateToolProcess(input: {
  toolId: string;
  allowsAnonymous: boolean;
  isAuthenticated: boolean;
  files: readonly WorkspaceFile[];
  maxFiles: number;
  maxPagesPerFile?: number | null;
  options: Record<string, unknown> | undefined;
}): ToolProcessValidation {
  if (!input.allowsAnonymous && !input.isAuthenticated) {
    return { ok: false, errorKey: "signInRequired" };
  }

  if (input.files.length === 0) {
    return { ok: false, errorKey: "noFile" };
  }

  if (input.files.length > input.maxFiles) {
    return { ok: false, errorKey: "tooManyFiles" };
  }

  const maxPagesPerFile = input.maxPagesPerFile;

  if (
    maxPagesPerFile !== null &&
    maxPagesPerFile !== undefined &&
    input.files.some(
      (entry) => entry.pageCount !== null && entry.pageCount > maxPagesPerFile,
    )
  ) {
    return { ok: false, errorKey: "tooManyPages" };
  }

  if (input.toolId === "merge-pdf" || input.toolId === "compare-pdf") {
    if (input.files.length < 2) {
      return { ok: false, errorKey: "tooFewFiles" };
    }
  }

  if (!isToolConversionType(input.toolId)) {
    return { ok: false, errorKey: "unsupported" };
  }

  const failed = input.files.find((entry) => entry.status === "failed");

  if (failed !== undefined) {
    return { ok: false, errorKey: failed.errorKey ?? "networkFailure" };
  }

  if (!areWorkspaceFilesReady(input.files)) {
    if (hasUploadingWorkspaceFiles(input.files)) {
      return { ok: false, reason: "uploading" };
    }

    return { ok: false, reason: "notReady" };
  }

  if (
    input.toolId !== "merge-pdf" &&
    input.toolId !== "repair-pdf" &&
    input.options === undefined &&
    TOOLS_REQUIRING_OPTIONS.has(input.toolId)
  ) {
    return { ok: false, errorKey: "invalidOptions" };
  }

  return { ok: true };
}
