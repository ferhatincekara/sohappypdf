import { isSupportedUploadMimeType } from "@sohappypdf/conversions";
import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import {
  DEFAULT_FILE_LIST_LIMIT,
  MAX_ARCHIVE_FILES,
  MAX_FILE_LIST_LIMIT,
  MAX_FILE_SIZE_BYTES,
  MIN_ARCHIVE_FILES,
} from "@sohappypdf/files";
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

  const archiveSchema = z.object({
    files: z
      .array(
        z.object({
          id: fileIdSchema,
          name: z
            .string()
            .trim()
            .min(1, "Invalid original filename")
            .max(255, "Invalid original filename")
            .optional(),
        }),
      )
      .min(MIN_ARCHIVE_FILES, "Invalid archive files")
      .max(MAX_ARCHIVE_FILES, "Invalid archive files"),
    archiveName: z
      .string()
      .trim()
      .min(1, "Invalid original filename")
      .max(255, "Invalid original filename")
      .optional(),
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
    parseArchiveRequest(value: unknown): {
      files: Array<{ id: string; name?: string }>;
      archiveName?: string;
    } {
      const parsed = parseWithSchema(archiveSchema, value);
      const files: Array<{ id: string; name?: string }> = [];

      for (const file of parsed.files) {
        if (file.id === undefined) {
          throw new AppError({
            code: APP_ERROR_CODES.VALIDATION_ERROR,
            message: "Invalid file id",
          });
        }

        files.push({ id: file.id, name: file.name });
      }

      return {
        archiveName: parsed.archiveName,
        files,
      };
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
