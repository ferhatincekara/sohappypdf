"use client";

import {
  CopyIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Trash2Icon,
  Undo2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  canDeleteSelectedOrganizeSlots,
  hasSelectedOrganizeSlots,
  type OrganizeSlot,
} from "../../lib/organize-pages";
import { PdfPageSelectionToolbar } from "../../pdf-workspace";

export function OrganizePdfToolbar({
  slots,
  pageCount,
  disabled,
  onSelectAll,
  onClear,
  onRotateLeft,
  onRotateRight,
  onDuplicate,
  onDelete,
  onReset,
}: {
  slots: readonly OrganizeSlot[];
  pageCount: number;
  disabled: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReset: () => void;
}) {
  const t = useTranslations("publicTools.workspaces.organize");
  const selectedCount = slots.filter((slot) => slot.selected).length;
  const hasSelection = hasSelectedOrganizeSlots(slots);
  const canDelete = canDeleteSelectedOrganizeSlots(slots);

  return (
    <div className="flex flex-col gap-3">
      <PdfPageSelectionToolbar
        selectedCount={selectedCount}
        pageCount={slots.length}
        isAllSelected={selectedCount > 0 && selectedCount === slots.length}
        disabled={disabled}
        onSelectAll={onSelectAll}
        onClear={onClear}
      />
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !hasSelection}
          onClick={onRotateLeft}
        >
          <RotateCcwIcon className="size-3.5" aria-hidden="true" />
          {t("rotateLeft")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !hasSelection}
          onClick={onRotateRight}
        >
          <RotateCwIcon className="size-3.5" aria-hidden="true" />
          {t("rotateRight")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !hasSelection}
          onClick={onDuplicate}
        >
          <CopyIcon className="size-3.5" aria-hidden="true" />
          {t("duplicate")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !canDelete}
          onClick={onDelete}
        >
          <Trash2Icon className="size-3.5" aria-hidden="true" />
          {t("delete")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || pageCount < 1}
          onClick={onReset}
        >
          <Undo2Icon className="size-3.5" aria-hidden="true" />
          {t("reset")}
        </Button>
      </div>
    </div>
  );
}
