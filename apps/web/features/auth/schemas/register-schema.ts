import { z } from "zod";
import {
  type AuthValidationTranslator,
  createEmailSchema,
  createPasswordSchema,
} from "@/features/auth/schemas/password";

export const AUTH_NAME_MAX_LENGTH = 80;

export function createRegisterSchema(t: AuthValidationTranslator) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t("required"))
        .max(AUTH_NAME_MAX_LENGTH, t("nameMax")),
      email: createEmailSchema(t),
      password: createPasswordSchema(t),
      confirmPassword: z.string().min(1, t("required")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;
