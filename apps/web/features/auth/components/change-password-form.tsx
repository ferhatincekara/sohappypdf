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
import { useChangePassword } from "@/features/auth/hooks/use-change-password";

export function ChangePasswordForm() {
  const t = useTranslations("settings.password");
  const tFields = useTranslations("auth.fields");
  const { form, onSubmit, isSubmitting } = useChangePassword();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FieldGroup className="gap-4">
        <Field data-invalid={errors.currentPassword !== undefined || undefined}>
          <FieldLabel htmlFor="currentPassword" className="font-semibold">
            {t("current")}
          </FieldLabel>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            aria-invalid={errors.currentPassword !== undefined}
            aria-describedby={
              errors.currentPassword ? "current-password-error" : undefined
            }
            disabled={isSubmitting}
            showLabel={tFields("showPassword")}
            hideLabel={tFields("hidePassword")}
            {...register("currentPassword")}
          />
          <FieldError
            id="current-password-error"
            errors={[errors.currentPassword]}
          />
        </Field>
        <Field data-invalid={errors.password !== undefined || undefined}>
          <FieldLabel htmlFor="newPassword" className="font-semibold">
            {t("newPassword")}
          </FieldLabel>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            aria-invalid={errors.password !== undefined}
            aria-describedby={
              errors.password ? "new-password-error" : undefined
            }
            disabled={isSubmitting}
            showLabel={tFields("showPassword")}
            hideLabel={tFields("hidePassword")}
            {...register("password")}
          />
          <FieldError id="new-password-error" errors={[errors.password]} />
        </Field>
        <Field data-invalid={errors.confirmPassword !== undefined || undefined}>
          <FieldLabel htmlFor="confirmNewPassword" className="font-semibold">
            {t("confirm")}
          </FieldLabel>
          <PasswordInput
            id="confirmNewPassword"
            autoComplete="new-password"
            aria-invalid={errors.confirmPassword !== undefined}
            aria-describedby={
              errors.confirmPassword ? "confirm-new-password-error" : undefined
            }
            disabled={isSubmitting}
            showLabel={tFields("showPassword")}
            hideLabel={tFields("hidePassword")}
            {...register("confirmPassword")}
          />
          <FieldError
            id="confirm-new-password-error"
            errors={[errors.confirmPassword]}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
