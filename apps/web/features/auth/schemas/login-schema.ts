import { z } from "zod";
import {
  type AuthValidationTranslator,
  createEmailSchema,
} from "@/features/auth/schemas/password";

export function createLoginSchema(t: AuthValidationTranslator) {
  return z.object({
    email: createEmailSchema(t),
    password: z.string().min(1, t("required")),
  });
}

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
