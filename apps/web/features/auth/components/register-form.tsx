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
import { Link } from "@/lib/i18n/navigation";
import { useRegister } from "../hooks/use-register";
import { AUTH_PATHS } from "../paths";
import { AuthFormError } from "./auth-form-error";

export function RegisterForm({ next }: { next?: string | null }) {
  const t = useTranslations("auth.register");
  const { form, onSubmit, formError, isSubmitting } = useRegister(next);
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <AuthFormError message={formError} />
      <FieldGroup>
        <Field data-invalid={errors.email !== undefined || undefined}>
          <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            disabled={isSubmitting}
            {...register("email")}
          />
          <FieldError id="email-error" errors={[errors.email]} />
        </Field>
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
      <Link
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        href={AUTH_PATHS.login}
      >
        {t("loginLink")}
      </Link>
    </form>
  );
}
