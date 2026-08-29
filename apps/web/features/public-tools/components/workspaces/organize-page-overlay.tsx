"use client";

import { RotateCwIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { PdfPage } from "@/features/public-tools/pdf-workspace";

export function OrganizePageOverlay({
  page,
  disabled,
  canDelete,
  onRotate,
  onDelete,
}: {
  page: PdfPage;
  disabled: boolean;
  canDelete: boolean;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("publicTools.workspaces.organize");

  return (
    <span className="absolute inset-x-0 bottom-1 z-10 flex justify-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
      <Button
        type="button"
        size="icon-xs"
        variant="secondary"
        disabled={disabled}
        aria-label={t("rotatePage", { number: page.pageNumber })}
        onClick={(event) => {
          event.stopPropagation();
          onRotate(page.id);
        }}
      >
        <RotateCwIcon className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="icon-xs"
        variant="secondary"
        disabled={disabled || !canDelete}
        aria-label={t("deletePage", { number: page.pageNumber })}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(page.id);
        }}
      >
        <Trash2Icon className="size-3.5" aria-hidden="true" />
      </Button>
    </span>
  );
}
