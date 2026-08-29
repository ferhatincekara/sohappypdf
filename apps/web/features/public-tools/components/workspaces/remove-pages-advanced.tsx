"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { parseSplitRangesInput } from "@/features/public-tools/lib/tool-workspace";
import {
  pagesToRangeInput,
  rangesToPages,
} from "@/features/public-tools/pdf-workspace";

export function RemovePagesAdvanced({
  selectedPages,
  disabled,
  onSelectedPagesChange,
}: {
  selectedPages: readonly number[];
  disabled: boolean;
  onSelectedPagesChange: (pages: number[]) => void;
}) {
  const t = useTranslations("publicTools.workspaces.remove");
  const committed = pagesToRangeInput(selectedPages);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? committed;
  const invalid =
    draft !== null &&
    draft.trim().length > 0 &&
    parseSplitRangesInput(draft) === undefined;

  function applyDraft(next: string): void {
    setDraft(next);

    if (next.trim().length === 0) {
      onSelectedPagesChange([]);
      return;
    }

    const ranges = parseSplitRangesInput(next);

    if (ranges !== undefined) {
      onSelectedPagesChange(rangesToPages(ranges));
    }
  }

  return (
    <details className="group">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground">
        {t("advanced")}
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        <p className="text-sm text-foreground">{t("advancedTitle")}</p>
        <p className="text-xs text-muted-foreground text-pretty">
          {t("advancedHint")}
        </p>
        <Input
          value={value}
          disabled={disabled}
          placeholder={t("advancedPlaceholder")}
          aria-label={t("advancedTitle")}
          aria-invalid={invalid}
          aria-describedby={
            invalid ? "remove-range-error" : "remove-range-example"
          }
          onChange={(event) => {
            applyDraft(event.target.value);
          }}
          onBlur={() => {
            setDraft(null);
          }}
        />
        <p id="remove-range-example" className="text-xs text-muted-foreground">
          {t("advancedExample")}
        </p>
        {invalid ? (
          <p id="remove-range-error" className="text-xs text-destructive">
            {t("advancedError")}
          </p>
        ) : null}
      </div>
    </details>
  );
}
