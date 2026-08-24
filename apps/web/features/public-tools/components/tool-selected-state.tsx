"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { loginPath } from "@/features/auth/paths";
import { Link } from "@/lib/i18n/navigation";
import type { ToolSelectedUxState } from "../types/tool-ux-state";
import { ToolDropzone } from "./tool-dropzone";
import { ToolFileList } from "./tool-file-list";

export function ToolSelectedState({
  toolRoute,
  state,
  accept,
  multiple,
  canAddFiles,
  formatsLabel,
  maxSizeLabel,
  reorderable,
  disabled,
  canProcess,
  processLabel,
  options,
  onSelectFiles,
  onMove,
  onReorder,
  onRemove,
  onRetryUpload,
  onProcess,
}: {
  toolRoute: `/${string}`;
  state: ToolSelectedUxState;
  accept: string;
  multiple: boolean;
  canAddFiles: boolean;
  formatsLabel: string;
  maxSizeLabel: string;
  reorderable: boolean;
  disabled: boolean;
  canProcess: boolean;
  processLabel: string;
  options: ReactNode;
  onSelectFiles: (files: FileList | File[]) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
  onRetryUpload: (id: string) => void;
  onProcess: () => void;
}) {
  const t = useTranslations("publicTools");
  const files = state.files;

  return (
    <div className="flex flex-col gap-6">
      <ToolFileList
        files={files}
        reorderable={reorderable}
        disabled={disabled}
        onMove={onMove}
        onReorder={onReorder}
        onRemove={onRemove}
        onRetry={onRetryUpload}
      />

      {canAddFiles ? (
        <ToolDropzone
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          formatsLabel={formatsLabel}
          maxSizeLabel={maxSizeLabel}
          variant="compact"
          onSelectFiles={onSelectFiles}
        />
      ) : null}

      {options}

      {state.error !== null ? (
        <Alert variant="destructive">
          <AlertTitle>{t("errors.title")}</AlertTitle>
          <AlertDescription>
            <p>{t(`errors.${state.error.key}`)}</p>
            {state.error.key === "signInRequired" ? (
              <p className="mt-2">
                <Link
                  href={loginPath(toolRoute)}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {t("errors.signInCta")}
                </Link>
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="hidden md:block">
        <Button
          type="button"
          size="lg"
          disabled={!canProcess}
          onClick={onProcess}
        >
          {processLabel}
        </Button>
      </div>
    </div>
  );
}
