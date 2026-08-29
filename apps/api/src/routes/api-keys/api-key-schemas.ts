import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import { z } from "zod";

const API_KEY_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_API_KEY_NAME_LENGTH = 80;

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0);

    if (code !== undefined && (code < 32 || code === 127)) {
      return true;
    }
  }

  return false;
}

function parseWithSchema<S extends z.ZodType>(
  schema: S,
  value: unknown,
): z.output<S> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new AppError({
      code: APP_ERROR_CODES.VALIDATION_ERROR,
      message: result.error.issues[0]?.message ?? "Invalid request",
    });
  }

  return result.data;
}

const createApiKeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Invalid API key name")
    .max(MAX_API_KEY_NAME_LENGTH, "Invalid API key name")
    .refine((value) => !hasControlCharacter(value), "Invalid API key name"),
});

const apiKeyIdSchema = z
  .string()
  .regex(API_KEY_ID_PATTERN, "Invalid API key id");

export function parseCreateApiKey(value: unknown) {
  return parseWithSchema(createApiKeySchema, value);
}

export function parseApiKeyId(value: string) {
  return parseWithSchema(apiKeyIdSchema, value);
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
