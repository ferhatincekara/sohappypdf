import { isSupportedUploadMimeType } from "@repo/conversions";
import { APP_ERROR_CODES, AppError } from "@repo/core";
import {
  DEFAULT_FILE_LIST_LIMIT,
  MAX_FILE_LIST_LIMIT,
  MAX_FILE_SIZE_BYTES,
} from "@repo/files";
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

export function createFileSchemas(
  maxUploadFileSizeBytes = MAX_FILE_SIZE_BYTES,
) {
  const uploadIntentSchema = z.object({
    filename: z
      .string()
      .trim()
      .min(1, "Invalid original filename")
      .max(255, "Invalid original filename"),
    contentType: z
      .string()
      .trim()
      .min(1, "Unsupported content type")
      .max(200, "Unsupported content type")
      .refine(isSupportedUploadMimeType, "Unsupported content type"),
    size: z
      .number({ invalid_type_error: "Invalid file size" })
      .int("Invalid file size")
      .positive("Invalid file size")
      .max(maxUploadFileSizeBytes, "Invalid file size"),
  });

  const fileIdSchema = z.string().regex(FILE_ID_PATTERN, "Invalid file id");

  const listFilesQuerySchema = z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_FILE_LIST_LIMIT)
      .default(DEFAULT_FILE_LIST_LIMIT),
    cursor: z.string().trim().min(1).max(512).optional(),
  });

  return {
    parseUploadIntent(value: unknown) {
      return parseWithSchema(uploadIntentSchema, value);
    },
    parseFileId(value: string) {
      return parseWithSchema(fileIdSchema, value);
    },
    parseListQuery(value: unknown) {
      return parseWithSchema(listFilesQuerySchema, value);
    },
  };
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
