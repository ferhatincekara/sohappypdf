"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getFileInputAccept } from "../lib/supported-upload-types";

export function FileUploadDropzone({
  disabled,
  onOpenPicker,
  onSelectFiles,
}: {
  disabled: boolean;
  onOpenPicker: () => void;
  onSelectFiles: (files: FileList | File[] | null) => void;
}) {
  const t = useTranslations("files.upload");
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
        "relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center outline-none transition-colors",
        "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        isDragging && !disabled && "border-foreground bg-muted/60",
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
        accept={getFileInputAccept()}
        disabled={disabled}
        aria-describedby={hintId}
        onClick={onOpenPicker}
        onChange={(event) => {
          onSelectFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
        <Upload className="size-5" aria-hidden="true" />
      </span>
      <span className="text-sm font-medium text-foreground">
        {t("dropzoneTitle")}
      </span>
      <span id={hintId} className="max-w-sm text-sm text-muted-foreground">
        {t("dropzoneHint")}
      </span>
    </label>
  );
}
