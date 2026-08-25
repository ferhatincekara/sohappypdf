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
  variant = "default",
}: {
  accept: string;
  multiple: boolean;
  disabled: boolean;
  formatsLabel: string;
  maxSizeLabel: string;
  onSelectFiles: (files: FileList | File[]) => void;
  variant?: "default" | "compact";
}) {
  const t = useTranslations("publicTools.upload");
  const inputId = useId();
  const hintId = useId();
  const dragDepth = useRef(0);
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
        "relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center outline-none transition-colors motion-safe:duration-150",
        compact ? "px-4 py-6" : "px-6 py-16",
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
      <span className="flex size-12 items-center justify-center rounded-full bg-muted/70 text-muted-foreground">
        <UploadIcon className="size-5" aria-hidden="true" />
      </span>
      <span className="text-base font-medium text-foreground">{title}</span>
      <span
        id={hintId}
        className={
          compact ? "sr-only" : "max-w-md text-sm text-muted-foreground"
        }
      >
        {t("hint", { formats: formatsLabel, size: maxSizeLabel })}
      </span>
      <span className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-4 text-sm font-medium text-foreground underline-offset-4 hover:underline">
        {browse}
      </span>
    </label>
  );
}
