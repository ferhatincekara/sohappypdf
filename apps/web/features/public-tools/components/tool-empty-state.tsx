"use client";

import { useTranslations } from "next-intl";
import { PUBLIC_ANONYMOUS_RETENTION_HOURS } from "../lib/anonymous-limits";
import { ToolDropzone } from "./tool-dropzone";

export function ToolEmptyState({
  accept,
  multiple,
  formatsLabel,
  maxSizeLabel,
  onSelectFiles,
}: {
  accept: string;
  multiple: boolean;
  formatsLabel: string;
  maxSizeLabel: string;
  onSelectFiles: (files: FileList | File[]) => void;
}) {
  const t = useTranslations("publicTools");

  return (
    <div className="flex flex-col gap-4">
      <ToolDropzone
        accept={accept}
        multiple={multiple}
        disabled={false}
        formatsLabel={formatsLabel}
        maxSizeLabel={maxSizeLabel}
        onSelectFiles={onSelectFiles}
      />
      <p className="text-sm text-muted-foreground text-pretty">
        {t("states.empty.privacy", {
          hours: PUBLIC_ANONYMOUS_RETENTION_HOURS,
        })}
      </p>
    </div>
  );
}
