import { z } from "zod";
import {
  isCreatableConversion,
  listCreatableConversionTypes,
  resolveCreatableConversionType,
} from "@/features/conversions/lib/conversion-capabilities";
import type { ConversionSourceFormat } from "@/features/conversions/types/conversion";
import {
  CONVERSION_TARGET_FORMATS,
  CONVERSION_TYPES,
  type ConversionTargetFormat,
  type ConversionType,
} from "@/features/conversions/types/conversion";

export const FILE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const CONVERSION_ID_PATTERN = FILE_ID_PATTERN;

export type ConversionValidationTranslator = (key: string) => string;

function isConversionType(value: string): value is ConversionType {
  return CONVERSION_TYPES.some((type) => type === value);
}

function isTargetFormat(value: string): value is ConversionTargetFormat {
  return CONVERSION_TARGET_FORMATS.some((format) => format === value);
}

export function createConversionFormSchema(
  t: ConversionValidationTranslator,
  sourceFormat: ConversionSourceFormat,
) {
  return z
    .object({
      sourceFileId: z.string().regex(FILE_ID_PATTERN, t("invalidFile")),
      targetFormat: z.string().min(1, t("targetRequired")),
      type: z.string().optional(),
    })
    .superRefine((value, context) => {
      if (!isTargetFormat(value.targetFormat)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetFormat"],
          message: t("invalidTargetFormat"),
        });
        return;
      }

      const types = listCreatableConversionTypes(
        sourceFormat,
        value.targetFormat,
      );
      const selectedType =
        value.type === undefined || value.type === ""
          ? undefined
          : isConversionType(value.type)
            ? value.type
            : undefined;

      if (types.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetFormat"],
          message: t("unsupportedConversion"),
        });
        return;
      }

      if (types.length > 1 && selectedType === undefined) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["type"],
          message: t("typeRequired"),
        });
        return;
      }

      if (
        !isCreatableConversion(sourceFormat, value.targetFormat, selectedType)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: selectedType === undefined ? ["targetFormat"] : ["type"],
          message: t("unsupportedConversion"),
        });
      }
    });
}

export type CreateConversionFormValues = z.infer<
  ReturnType<typeof createConversionFormSchema>
>;

export function toCreateConversionInput(
  values: CreateConversionFormValues,
  sourceFormat: ConversionSourceFormat,
) {
  if (!isTargetFormat(values.targetFormat)) {
    return undefined;
  }

  const selectedType =
    values.type === undefined || values.type === ""
      ? undefined
      : isConversionType(values.type)
        ? values.type
        : undefined;
  const type = resolveCreatableConversionType(
    sourceFormat,
    values.targetFormat,
    selectedType,
  );

  if (type === undefined) {
    return undefined;
  }

  const inferredTypes = listCreatableConversionTypes(
    sourceFormat,
    values.targetFormat,
  );

  return {
    sourceFileId: values.sourceFileId,
    targetFormat: values.targetFormat,
    ...(inferredTypes.length > 1 ? { type } : {}),
  };
}

export function isConversionId(value: string): boolean {
  return CONVERSION_ID_PATTERN.test(value);
}
