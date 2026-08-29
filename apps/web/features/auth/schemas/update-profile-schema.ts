import { z } from "zod";
import {
  type AuthValidationTranslator,
  createEmailSchema,
} from "@/features/auth/schemas/password";
import { AUTH_NAME_MAX_LENGTH } from "@/features/auth/schemas/register-schema";

export function createUpdateProfileSchema(t: AuthValidationTranslator) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("required"))
      .max(AUTH_NAME_MAX_LENGTH, t("nameMax")),
    email: createEmailSchema(t),
  });
}

export type UpdateProfileValues = z.infer<
  ReturnType<typeof createUpdateProfileSchema>
>;
