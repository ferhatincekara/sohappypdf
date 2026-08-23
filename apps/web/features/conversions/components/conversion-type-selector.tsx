"use client";

import { useTranslations } from "next-intl";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type { ConversionType } from "../types/conversion";

export function ConversionTypeSelector({
  types,
  value,
  disabled,
  error,
  onChange,
}: {
  types: ConversionType[];
  value: string;
  disabled: boolean;
  error?: string;
  onChange: (value: ConversionType) => void;
}) {
  const t = useTranslations("conversions.form");

  if (types.length < 2) {
    return null;
  }

  return (
    <Field data-invalid={error !== undefined || undefined}>
      <FieldLabel>{t("conversionType")}</FieldLabel>
      <FieldDescription>{t("conversionTypeHint")}</FieldDescription>
      <div
        role="radiogroup"
        aria-label={t("conversionType")}
        aria-invalid={error !== undefined}
        aria-describedby={
          error === undefined ? "conversion-type-hint" : "conversion-type-error"
        }
        className="grid gap-2"
      >
        {types.map((type) => (
          <label
            key={type}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:checked]:border-foreground"
          >
            <input
              type="radio"
              name="conversionType"
              value={type}
              checked={value === type}
              disabled={disabled}
              className="size-4 accent-foreground"
              onChange={() => onChange(type)}
            />
            <span className="font-medium">{t(`types.${type}`)}</span>
          </label>
        ))}
      </div>
      <FieldError id="conversion-type-error" errors={[{ message: error }]} />
    </Field>
  );
}
