"use client";

import { UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ToolDropzone({
  accept,
  multiple,
  disabled,
  formatsLabel,
  maxSizeLabel,
  onSelectFiles,
}: {
  accept: string;
  multiple: boolean;
  disabled: boolean;
  formatsLabel: string;
  maxSizeLabel: string;
  onSelectFiles: (files: FileList | File[]) => void;
}) {
  const t = useTranslations("publicTools.upload");
  const inputId = useId();
  const hintId = useId();
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  function resetDragging() {
    dragDepth.current = 0;
    setIsDragging(false);
  }

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "relative flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center outline-none transition-colors motion-safe:duration-150",
        "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        isDragging && !disabled && "border-foreground bg-muted/50",
        disabled && "pointer-events-none cursor-not-allowed opacity-60",
      )}
      onDragEnter={(event) => {
        event.preventDefault();
        if (disabled) {
          return;
        }

        dragDepth.current += 1;
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? "none" : "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);

        if (dragDepth.current === 0) {
          setIsDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        resetDragging();

        if (disabled) {
          return;
        }

        onSelectFiles(event.dataTransfer.files);
      }}
    >
      <input
        id={inputId}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-describedby={hintId}
        onChange={(event) => {
          if (event.target.files !== null) {
            onSelectFiles(event.target.files);
          }
          event.target.value = "";
        }}
      />
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-foreground">
        <UploadIcon className="size-5" aria-hidden="true" />
      </span>
      <span className="text-base font-medium text-foreground">
        {multiple ? t("titleMultiple") : t("title")}
      </span>
      <span id={hintId} className="max-w-md text-sm text-muted-foreground">
        {t("hint", { formats: formatsLabel, size: maxSizeLabel })}
      </span>
      <span className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
        {multiple ? t("browseMultiple") : t("browse")}
      </span>
    </label>
  );
}
