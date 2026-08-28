"use client";

import { CloudUploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { createDropInputGate } from "@/features/files/lib/drop-input-gate";
import { cn } from "@/lib/utils";

export function ToolDropzone({
  accept,
  multiple,
  disabled,
  formatsLabel,
  maxSizeLabel,
  maxPagesPerFile = null,
  onSelectFiles,
  variant = "default",
}: {
  accept: string;
  multiple: boolean;
  disabled: boolean;
  formatsLabel: string;
  maxSizeLabel: string;
  maxPagesPerFile?: number | null;
  onSelectFiles: (files: FileList | File[]) => void;
  variant?: "default" | "compact";
}) {
  const t = useTranslations("publicTools.upload");
  const inputId = useId();
  const hintId = useId();
  const dragDepth = useRef(0);
  const selectionGate = useRef(createDropInputGate());
  const [isDragging, setIsDragging] = useState(false);
  const compact = variant === "compact";

  function resetDragging() {
    dragDepth.current = 0;
    setIsDragging(false);
  }

  const title = compact
    ? multiple
      ? t("addMoreMultiple")
      : t("addMore")
    : multiple
      ? t("titleMultiple")
      : t("title");
  const browse = compact
    ? t("addMoreBrowse")
    : multiple
      ? t("browseMultiple")
      : t("browse");

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "relative flex cursor-pointer flex-col items-center text-center outline-none transition-colors motion-safe:duration-150",
        "border border-dashed border-border",
        compact
          ? "flex-row justify-center gap-3 rounded-3 bg-white px-4 py-3"
          : "gap-4 rounded-7 bg-white px-5 py-12 md:min-h-88 md:px-6 md:py-20",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
        isDragging && !disabled && "border-foreground bg-primary/20",
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
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-describedby={hintId}
        onChange={(event) => {
          const files = selectionGate.current.captureInput(event.target.files);
          event.target.value = "";

          if (files.length > 0) {
            onSelectFiles(files);
          }
        }}
      />
      <CloudUploadIcon
        className={cn("text-foreground/70", compact ? "size-5" : "size-7")}
        aria-hidden="true"
      />
      <span
        className={cn(
          "font-extrabold tracking-tight text-foreground",
          compact ? "text-sm" : "mt-2 text-lg",
        )}
      >
        {title}
      </span>
      <span
        id={hintId}
        className={
          compact
            ? "sr-only"
            : "max-w-sm text-sm leading-relaxed text-muted-foreground"
        }
      >
        {maxPagesPerFile === null
          ? t("hint", { formats: formatsLabel, size: maxSizeLabel })
          : t("hintWithPageLimit", {
              formats: formatsLabel,
              size: maxSizeLabel,
              pages: maxPagesPerFile,
            })}
      </span>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-foreground font-semibold text-background",
          compact ? "h-8 px-3.5 text-xs" : "mt-1 h-11 px-5 text-sm",
        )}
      >
        {browse}
      </span>
    </label>
  );
}
