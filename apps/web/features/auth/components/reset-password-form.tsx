"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/features/auth/components/password-input";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth.resetPassword");
  const tFields = useTranslations("auth.fields");
  const { form, onSubmit, isSubmitting } = useResetPassword(token);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FieldGroup className="gap-4">
        <Field data-invalid={errors.password !== undefined || undefined}>
          <FieldLabel htmlFor="password" className="font-semibold">
            {t("password")}
          </FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            autoFocus
            placeholder={t("passwordPlaceholder")}
            aria-invalid={errors.password !== undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            disabled={isSubmitting}
            showLabel={tFields("showPassword")}
            hideLabel={tFields("hidePassword")}
            {...register("password")}
          />
          <FieldError id="password-error" errors={[errors.password]} />
        </Field>
        <Field data-invalid={errors.confirmPassword !== undefined || undefined}>
          <FieldLabel htmlFor="confirmPassword" className="font-semibold">
            {t("confirmPassword")}
          </FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder={t("passwordPlaceholder")}
            aria-invalid={errors.confirmPassword !== undefined}
            aria-describedby={
              errors.confirmPassword ? "confirm-password-error" : undefined
            }
            disabled={isSubmitting}
            showLabel={tFields("showPassword")}
            hideLabel={tFields("hidePassword")}
            {...register("confirmPassword")}
          />
          <FieldError
            id="confirm-password-error"
            errors={[errors.confirmPassword]}
          />
        </Field>
      </FieldGroup>
      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="mt-1 w-full"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
