"use client";

import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { createDropInputGate } from "@/features/files/lib/drop-input-gate";
import { getFileInputAccept } from "@/features/files/lib/supported-upload-types";
import { cn } from "@/lib/utils";

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
  const selectionGate = useRef(createDropInputGate());
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
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
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
        event.stopPropagation();
        resetDragging();

        if (disabled) {
          return;
        }

        const files = selectionGate.current.captureDrop(
          event.dataTransfer.files,
        );

        if (files.length > 0) {
          onSelectFiles(files);
        }
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
          const files = selectionGate.current.captureInput(event.target.files);
          event.target.value = "";

          if (files.length > 0) {
            onSelectFiles(files);
          }
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
