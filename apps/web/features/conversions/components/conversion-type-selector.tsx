"use client";

import { useTranslations } from "next-intl";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
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
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
              "has-checked:bg-foreground has-checked:text-background",
            )}
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
