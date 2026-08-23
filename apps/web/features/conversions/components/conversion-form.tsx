"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { BillingUpgradeLink } from "@/features/billing/components/billing-upgrade-link";
import type { PublicFile } from "@/features/files/types/file";
import { useCreateConversion } from "../hooks/use-create-conversion";
import {
  listCreatableConversionTypes,
  listTargetFormats,
} from "../lib/conversion-capabilities";
import { sourceFormatFromPublicFile } from "../lib/source-format";
import {
  type CreateConversionFormValues,
  createConversionFormSchema,
  toCreateConversionInput,
} from "../schemas/create-conversion-schema";
import type {
  ConversionTargetFormat,
  ConversionType,
} from "../types/conversion";
import { ConversionTypeSelector } from "./conversion-type-selector";
import { OutputFormatSelector } from "./output-format-selector";

export function ConversionForm({
  file,
  onCreated,
}: {
  file: PublicFile;
  onCreated: (conversionId: string) => void;
}) {
  const t = useTranslations("conversions.form");
  const tValidation = useTranslations("conversions.validation");
  const tErrors = useTranslations("conversions.errors");
  const sourceFormat = sourceFormatFromPublicFile(file);
  const targetFormats =
    sourceFormat === undefined ? [] : listTargetFormats(sourceFormat);
  const { createConversion, isPending, errorKey, reset } =
    useCreateConversion();

  const form = useForm<CreateConversionFormValues>({
    resolver:
      sourceFormat === undefined
        ? undefined
        : zodResolver(createConversionFormSchema(tValidation, sourceFormat)),
    defaultValues: {
      sourceFileId: file.id,
      targetFormat: targetFormats[0] ?? "",
      type: "",
    },
  });

  const targetFormat = form.watch("targetFormat");
  const selectedTypes =
    sourceFormat === undefined || targetFormat === ""
      ? []
      : listCreatableConversionTypes(
          sourceFormat,
          targetFormat as ConversionTargetFormat,
        );

  useEffect(() => {
    const nextFormat =
      sourceFormat === undefined
        ? ""
        : (listTargetFormats(sourceFormat)[0] ?? "");
    form.reset({
      sourceFileId: file.id,
      targetFormat: nextFormat,
      type: "",
    });
    reset();
  }, [file.id, form, reset, sourceFormat]);

  if (sourceFormat === undefined || targetFormats.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{tErrors("unsupportedConversion")}</AlertDescription>
      </Alert>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const input = toCreateConversionInput(values, sourceFormat);

    if (input === undefined) {
      return;
    }

    try {
      const conversion = await createConversion(input);
      onCreated(conversion.id);
    } catch {
      return;
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {errorKey === null ? null : (
        <Alert variant="destructive">
          <AlertDescription>
            {tErrors(errorKey)}
            {errorKey === "planLimitReached" ? (
              <span className="ml-1">
                <BillingUpgradeLink />
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      )}

      <p className="text-sm text-muted-foreground">
        {t("sourceFile", { filename: file.filename })}
      </p>

      <FieldGroup>
        <OutputFormatSelector
          formats={targetFormats}
          value={targetFormat}
          disabled={isPending}
          error={form.formState.errors.targetFormat?.message}
          onChange={(format) => {
            form.setValue("targetFormat", format, { shouldValidate: true });
            form.setValue("type", "");
          }}
        />
        <ConversionTypeSelector
          types={selectedTypes}
          value={form.watch("type") ?? ""}
          disabled={isPending}
          error={form.formState.errors.type?.message}
          onChange={(type: ConversionType) => {
            form.setValue("type", type, { shouldValidate: true });
          }}
        />
      </FieldGroup>

      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
