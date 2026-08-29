import { z } from "zod";
import {
  type AuthValidationTranslator,
  createEmailSchema,
} from "@/features/auth/schemas/password";

export function createForgotPasswordSchema(t: AuthValidationTranslator) {
  return z.object({
    email: createEmailSchema(t),
  });
}

export type ForgotPasswordValues = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;
