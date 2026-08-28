import { resolveWebMaxFilesPerOperation } from "@repo/billing/plans";
import type { AnonymousConfig } from "@repo/config";
import { isConversionType, normalizeFileFormat } from "@repo/conversions";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import {
  getRegisteredTool,
  isAnonymousToolAllowed,
  isRegisteredToolId,
  toolCombinesSourceFiles,
} from "@repo/tools";
import { z } from "zod";

const FILE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseWithSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: result.error.issues[0]?.message ?? "Invalid request",
    });
  }

  return result.data;
}

const createAnonymousConversionSchema = z.object({
  sourceFileId: z.string().regex(FILE_ID_PATTERN, "Invalid file id"),
  type: z.string().trim().min(1, "Unsupported conversion"),
  additionalFileIds: z
    .array(z.string().regex(FILE_ID_PATTERN, "Invalid file id"))
    .optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

export type AnonymousCreateConversionBody = {
  sourceFileId: string;
  type: string;
  additionalFileIds?: string[];
  options?: Record<string, unknown>;
};

export function parseCreateAnonymousConversion(
  value: unknown,
): AnonymousCreateConversionBody {
  return parseWithSchema(createAnonymousConversionSchema, value);
}

export function resolveAnonymousConversionRequest(
  body: AnonymousCreateConversionBody,
  config: AnonymousConfig,
) {
  if (!isRegisteredToolId(body.type) || !isAnonymousToolAllowed(body.type)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Unsupported conversion",
    });
  }

  if (!isConversionType(body.type)) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Unsupported conversion",
    });
  }

  const tool = getRegisteredTool(body.type);
  const outputFormat = tool.outputFormats[0];
  const targetFormat =
    outputFormat === undefined ? undefined : normalizeFileFormat(outputFormat);

  if (targetFormat === undefined) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Unsupported conversion",
    });
  }

  const maxFiles = resolveWebMaxFilesPerOperation({
    isAuthenticated: false,
    toolMaxInputCount: tool.maxInputCount,
    planMaxFilesPerOperation: config.maxFilesPerOperation,
    combinesSourceFiles: toolCombinesSourceFiles(body.type),
    supportsBatch: false,
  });
  const maxAdditional = Math.max(0, maxFiles - 1);
  const additionalFileIds = body.additionalFileIds ?? [];

  if (additionalFileIds.length > maxAdditional) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Too many files",
    });
  }

  if (body.type === "merge-pdf" && additionalFileIds.length < 1) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid conversion options",
    });
  }

  return {
    type: body.type,
    targetFormat,
    additionalFileIds,
    options: body.options,
  };
}

export function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
