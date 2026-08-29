"use client";

import { ToolDropzone } from "@/features/public-tools/components/tool-dropzone";

export function ToolEmptyState({
  accept,
  multiple,
  formatsLabel,
  maxSizeLabel,
  maxPagesPerFile = null,
  onSelectFiles,
}: {
  accept: string;
  multiple: boolean;
  formatsLabel: string;
  maxSizeLabel: string;
  maxPagesPerFile?: number | null;
  onSelectFiles: (files: FileList | File[]) => void;
}) {
  return (
    <ToolDropzone
      accept={accept}
      multiple={multiple}
      disabled={false}
      formatsLabel={formatsLabel}
      maxSizeLabel={maxSizeLabel}
      maxPagesPerFile={maxPagesPerFile}
      onSelectFiles={onSelectFiles}
    />
  );
}
