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
  "organize-pdf",
  "reorder-pages",
  "remove-pages",
  "rotate-pdf",
  "watermark-pdf",
  "protect-pdf",
  "unlock-pdf",
  "translate-pdf",
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

  if (input.toolId === "merge-pdf" && input.files.length < 2) {
    return { ok: false, errorKey: "tooFewFiles" };
  }

  if (!isToolConversionType(input.toolId)) {
    return { ok: false, errorKey: "unsupported" };
  }

  if (input.files.some((entry) => entry.status === "failed")) {
    return { ok: false, errorKey: "networkFailure" };
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
