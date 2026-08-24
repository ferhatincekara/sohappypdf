import type { ToolDefinition } from "@repo/tools/catalog";
import {
  formatFromPublicFile,
  resolveUploadContentType,
} from "@/features/files/lib/supported-upload-types";
import type { PublicFile } from "@/features/files/types/file";
import {
  INITIAL_UPLOAD_PROGRESS,
  type UploadProgress,
} from "@/features/files/types/upload-state";
import type { PublicToolErrorKey } from "./public-tool-errors";

export const WORKSPACE_FILE_STATUSES = [
  "pending",
  "uploading",
  "ready",
  "failed",
] as const;

export type WorkspaceFileStatus = (typeof WORKSPACE_FILE_STATUSES)[number];

export type WorkspaceFile = {
  id: string;
  file: File;
  previewUrl: string | null;
  status: WorkspaceFileStatus;
  progress: UploadProgress;
  publicFile: PublicFile | null;
  errorKey: PublicToolErrorKey | null;
};

export function supportsFileReorder(tool: ToolDefinition): boolean {
  return tool.maxInputCount > 1;
}

export function canPreviewFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function createPreviewUrl(file: File): string | null {
  if (!canPreviewFile(file) || typeof URL === "undefined") {
    return null;
  }

  return URL.createObjectURL(file);
}

export function revokePreviewUrl(url: string | null): void {
  if (url === null || typeof URL === "undefined") {
    return;
  }

  URL.revokeObjectURL(url);
}

export function fileExtensionLabel(filename: string): string {
  const separator = filename.lastIndexOf(".");

  if (separator <= 0 || separator === filename.length - 1) {
    return "FILE";
  }

  return filename.slice(separator + 1).toUpperCase();
}

export function resolveToolFileContentType(
  file: File,
  inputFormats: readonly string[],
): string | null {
  if (file.size < 1) {
    return null;
  }

  const contentType = resolveUploadContentType(file);

  if (contentType === undefined) {
    return null;
  }

  const format = formatFromPublicFile({
    contentType,
    filename: file.name,
  });

  if (format === undefined) {
    return null;
  }

  if (!inputFormats.some((allowed) => allowed === format)) {
    return null;
  }

  return contentType;
}

export function createWorkspaceFiles(
  selected: FileList | File[] | null,
  options?: {
    createId?: () => string;
    createPreview?: (file: File) => string | null;
  },
): WorkspaceFile[] {
  if (selected === null) {
    return [];
  }

  const createId = options?.createId ?? (() => crypto.randomUUID());
  const createPreview = options?.createPreview ?? createPreviewUrl;
  const list = Array.isArray(selected) ? selected : Array.from(selected);

  return list.map((file) => ({
    id: createId(),
    file,
    previewUrl: createPreview(file),
    status: "pending",
    progress: INITIAL_UPLOAD_PROGRESS,
    publicFile: null,
    errorKey: null,
  }));
}

export function appendWorkspaceFiles(
  current: readonly WorkspaceFile[],
  incoming: readonly WorkspaceFile[],
  maxFiles: number,
): {
  files: WorkspaceFile[];
  rejected: "tooManyFiles" | null;
} {
  if (incoming.length === 0) {
    return { files: [...current], rejected: null };
  }

  const remaining = Math.max(0, maxFiles - current.length);

  if (remaining === 0) {
    for (const entry of incoming) {
      revokePreviewUrl(entry.previewUrl);
    }

    return { files: [...current], rejected: "tooManyFiles" };
  }

  if (incoming.length > remaining) {
    for (const entry of incoming.slice(remaining)) {
      revokePreviewUrl(entry.previewUrl);
    }

    return {
      files: [...current, ...incoming.slice(0, remaining)],
      rejected: "tooManyFiles",
    };
  }

  return {
    files: [...current, ...incoming],
    rejected: null,
  };
}

export function removeWorkspaceFile(
  current: readonly WorkspaceFile[],
  id: string,
): WorkspaceFile[] {
  const next: WorkspaceFile[] = [];

  for (const entry of current) {
    if (entry.id === id) {
      revokePreviewUrl(entry.previewUrl);
      continue;
    }

    next.push(entry);
  }

  return next;
}

export function clearWorkspaceFiles(
  current: readonly WorkspaceFile[],
): WorkspaceFile[] {
  for (const entry of current) {
    revokePreviewUrl(entry.previewUrl);
  }

  return [];
}

export function moveWorkspaceFile(
  current: readonly WorkspaceFile[],
  index: number,
  direction: -1 | 1,
): WorkspaceFile[] {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= current.length) {
    return [...current];
  }

  const next = [...current];
  const currentFile = next[index];
  const swapFile = next[nextIndex];

  if (currentFile === undefined || swapFile === undefined) {
    return [...current];
  }

  next[index] = swapFile;
  next[nextIndex] = currentFile;
  return next;
}

export function reorderWorkspaceFile(
  current: readonly WorkspaceFile[],
  fromIndex: number,
  toIndex: number,
): WorkspaceFile[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= current.length ||
    toIndex >= current.length
  ) {
    return [...current];
  }

  const next = [...current];
  const [moved] = next.splice(fromIndex, 1);

  if (moved === undefined) {
    return [...current];
  }

  next.splice(toIndex, 0, moved);
  return next;
}

export function patchWorkspaceFile(
  current: readonly WorkspaceFile[],
  id: string,
  patch: Partial<
    Pick<
      WorkspaceFile,
      "status" | "progress" | "publicFile" | "errorKey" | "previewUrl"
    >
  >,
): WorkspaceFile[] {
  return current.map((entry) =>
    entry.id === id
      ? {
          ...entry,
          ...patch,
        }
      : entry,
  );
}

export function areWorkspaceFilesReady(
  files: readonly WorkspaceFile[],
): boolean {
  return files.length > 0 && files.every((entry) => entry.status === "ready");
}

export function hasUploadingWorkspaceFiles(
  files: readonly WorkspaceFile[],
): boolean {
  return files.some((entry) => entry.status === "uploading");
}
