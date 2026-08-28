import { z } from "zod";
import {
  type AuthValidationTranslator,
  createPasswordSchema,
} from "./password";

export function createChangePasswordSchema(t: AuthValidationTranslator) {
  return z
    .object({
      currentPassword: z.string().min(1, t("required")),
      password: createPasswordSchema(t),
      confirmPassword: z.string().min(1, t("required")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export type ChangePasswordValues = z.infer<
  ReturnType<typeof createChangePasswordSchema>
>;
