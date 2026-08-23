import { z } from "zod";
import {
  type AuthValidationTranslator,
  createPasswordSchema,
} from "./password";

export function createResetPasswordSchema(t: AuthValidationTranslator) {
  return z
    .object({
      password: createPasswordSchema(t),
      confirmPassword: z.string().min(1, t("required")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export type ResetPasswordValues = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>;
