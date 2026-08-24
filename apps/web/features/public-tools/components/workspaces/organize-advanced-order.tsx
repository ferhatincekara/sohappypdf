"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  isValidOrganizeOrder,
  type OrganizeSlot,
  organizeSlotsFromOrder,
} from "../../lib/organize-pages";
import { parseOrganizeOrderInput } from "../../lib/tool-workspace";

export function OrganizeAdvancedOrder({
  slots,
  pageCount,
  disabled,
  onApply,
}: {
  slots: readonly OrganizeSlot[];
  pageCount: number;
  disabled: boolean;
  onApply: (next: OrganizeSlot[]) => void;
}) {
  const t = useTranslations("publicTools.workspaces.organize");
  const committed = slots.map((slot) => slot.sourcePageNumber).join(", ");
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? committed;
  const parsed = draft === null ? undefined : parseOrganizeOrderInput(draft);
  const invalid =
    draft !== null &&
    draft.trim().length > 0 &&
    (parsed === undefined || !isValidOrganizeOrder(parsed, pageCount));

  function applyDraft(next: string): void {
    setDraft(next);
    const order = parseOrganizeOrderInput(next);

    if (order === undefined || !isValidOrganizeOrder(order, pageCount)) {
      return;
    }

    onApply(organizeSlotsFromOrder(order, undefined));
  }

  return (
    <details className="group">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        {t("advanced")}
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        <p className="text-sm text-foreground">{t("advancedTitle")}</p>
        <p className="text-xs text-muted-foreground text-pretty">
          {t("advancedHint")}
        </p>
        <Input
          value={value}
          disabled={disabled || pageCount < 1}
          placeholder={t("advancedPlaceholder")}
          aria-label={t("advancedTitle")}
          aria-invalid={invalid}
          aria-describedby={
            invalid ? "organize-order-error" : "organize-order-example"
          }
          onChange={(event) => {
            applyDraft(event.target.value);
          }}
          onBlur={() => {
            setDraft(null);
          }}
        />
        <p
          id="organize-order-example"
          className="text-xs text-muted-foreground"
        >
          {t("advancedExample")}
        </p>
        {invalid ? (
          <p id="organize-order-error" className="text-xs text-destructive">
            {t("advancedError")}
          </p>
        ) : null}
      </div>
    </details>
  );
}
