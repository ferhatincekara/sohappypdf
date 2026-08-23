import { z } from "zod";

export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_PASSWORD_MAX_LENGTH = 128;

export type AuthValidationTranslator = (key: string) => string;

export function createPasswordSchema(t: AuthValidationTranslator) {
  return z
    .string()
    .min(1, t("required"))
    .min(AUTH_PASSWORD_MIN_LENGTH, t("passwordMin"))
    .max(AUTH_PASSWORD_MAX_LENGTH, t("passwordMax"));
}

export function createEmailSchema(t: AuthValidationTranslator) {
  return z.string().min(1, t("required")).email(t("invalidEmail"));
}
