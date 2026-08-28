"use client";

import { useTranslations } from "next-intl";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import type { ConversionTargetFormat } from "../types/conversion";

export function OutputFormatSelector({
  formats,
  value,
  disabled,
  error,
  onChange,
}: {
  formats: ConversionTargetFormat[];
  value: string;
  disabled: boolean;
  error?: string;
  onChange: (value: ConversionTargetFormat) => void;
}) {
  const t = useTranslations("conversions.form");

  return (
    <Field data-invalid={error !== undefined || undefined}>
      <FieldLabel>{t("targetFormat")}</FieldLabel>
      <div
        role="radiogroup"
        aria-label={t("targetFormat")}
        aria-invalid={error !== undefined}
        aria-describedby={
          error === undefined ? undefined : "target-format-error"
        }
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {formats.map((format) => {
          const selected = value === format;

          return (
            <label
              key={format}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring has-checked:bg-foreground has-checked:text-background"
            >
              <input
                type="radio"
                name="targetFormat"
                value={format}
                checked={selected}
                disabled={disabled}
                className="size-4 accent-foreground"
                onChange={() => onChange(format)}
              />
              <span className="font-medium uppercase">
                {t(`formats.${format}`)}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id="target-format-error" errors={[{ message: error }]} />
    </Field>
  );
}
