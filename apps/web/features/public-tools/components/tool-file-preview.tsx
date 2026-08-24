"use client";

import { FileIcon } from "lucide-react";
import type { WorkspaceFile } from "../lib/workspace-files";

export function ToolFilePreview({
  entry,
  className = "size-12",
}: {
  entry: WorkspaceFile;
  className?: string;
}) {
  if (entry.previewUrl !== null) {
    return (
      // biome-ignore lint/performance/noImgElement: local object URL preview
      <img
        src={entry.previewUrl}
        alt=""
        className={`${className} shrink-0 rounded-md border border-border object-cover`}
      />
    );
  }

  return (
    <span
      className={`flex ${className} shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground`}
    >
      <FileIcon className="size-5" aria-hidden="true" />
    </span>
  );
}
