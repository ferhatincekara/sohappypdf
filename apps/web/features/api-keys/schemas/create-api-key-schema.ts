import { z } from "zod";

export const MAX_API_KEY_NAME_LENGTH = 80;

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0);

    if (code !== undefined && (code < 32 || code === 127)) {
      return true;
    }
  }

  return false;
}

export type ApiKeyValidationTranslator = (key: string) => string;

export function createApiKeyFormSchema(t: ApiKeyValidationTranslator) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("nameRequired"))
      .max(MAX_API_KEY_NAME_LENGTH, t("nameTooLong"))
      .refine((value) => !hasControlCharacter(value), t("nameInvalid")),
  });
}

export type CreateApiKeyFormValues = z.infer<
  ReturnType<typeof createApiKeyFormSchema>
>;
