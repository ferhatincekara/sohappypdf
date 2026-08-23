import { z } from "zod";
import {
  type AuthValidationTranslator,
  createEmailSchema,
  createPasswordSchema,
} from "./password";

export function createRegisterSchema(t: AuthValidationTranslator) {
  return z
    .object({
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
