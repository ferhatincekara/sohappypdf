import {
  CONVERSION_STATUSES,
  CONVERSION_TYPES,
  DEFAULT_CONVERSION_LIST_LIMIT,
  MAX_CONVERSION_LIST_LIMIT,
  normalizeFileFormat,
} from "@repo/conversions";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import { z } from "zod";

const CONVERSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FILE_ID_PATTERN = CONVERSION_ID_PATTERN;

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

const createConversionSchema = z.object({
  sourceFileId: z.string().regex(FILE_ID_PATTERN, "Invalid file id"),
  targetFormat: z
    .string()
    .trim()
    .min(1, "Invalid target format")
    .refine((value) => normalizeFileFormat(value) !== undefined, {
      message: "Invalid target format",
    }),
  type: z
    .enum(CONVERSION_TYPES, {
      errorMap: () => ({ message: "Unsupported conversion" }),
    })
    .optional(),
  additionalFileIds: z
    .array(z.string().regex(FILE_ID_PATTERN, "Invalid file id"))
    .max(20, "Invalid conversion options")
    .optional(),
});

const conversionIdSchema = z
  .string()
  .regex(CONVERSION_ID_PATTERN, "Invalid conversion id");

const listConversionsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_CONVERSION_LIST_LIMIT)
    .default(DEFAULT_CONVERSION_LIST_LIMIT),
  cursor: z.string().trim().min(1).max(512).optional(),
  status: z
    .enum(CONVERSION_STATUSES, {
      errorMap: () => ({ message: "Invalid conversion status" }),
    })
    .optional(),
  targetFormat: z
    .string()
    .trim()
    .refine((value) => normalizeFileFormat(value) !== undefined, {
      message: "Invalid target format",
    })
    .optional(),
});

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(1, "Invalid idempotency key")
  .max(128, "Invalid idempotency key");

export function parseCreateConversion(value: unknown) {
  return parseWithSchema(createConversionSchema, value);
}

export function parseConversionId(value: string) {
  return parseWithSchema(conversionIdSchema, value);
}

export function parseListConversionsQuery(value: unknown) {
  const query = parseWithSchema(listConversionsQuerySchema, value);

  return {
    ...query,
    targetFormat:
      query.targetFormat === undefined
        ? undefined
        : normalizeFileFormat(query.targetFormat),
    status: query.status,
  };
}

export function parseIdempotencyKey(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return parseWithSchema(idempotencyKeySchema, value);
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid request",
    });
  }
}
