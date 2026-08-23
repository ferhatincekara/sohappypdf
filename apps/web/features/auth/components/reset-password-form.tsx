"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "../hooks/use-reset-password";
import { AuthFormError } from "./auth-form-error";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth.resetPassword");
  const { form, onSubmit, formError, isSubmitting } = useResetPassword(token);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <AuthFormError message={formError} />
      <FieldGroup>
        <Field data-invalid={errors.password !== undefined || undefined}>
          <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password !== undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            disabled={isSubmitting}
            {...register("password")}
          />
          <FieldError id="password-error" errors={[errors.password]} />
        </Field>
        <Field data-invalid={errors.confirmPassword !== undefined || undefined}>
          <FieldLabel htmlFor="confirmPassword">
            {t("confirmPassword")}
          </FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.confirmPassword !== undefined}
            aria-describedby={
              errors.confirmPassword ? "confirm-password-error" : undefined
            }
            disabled={isSubmitting}
            {...register("confirmPassword")}
          />
          <FieldError
            id="confirm-password-error"
            errors={[errors.confirmPassword]}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
