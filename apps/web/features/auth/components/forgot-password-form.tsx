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
import { AuthInlineNotice } from "@/features/auth/components/auth-inline-notice";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import { AUTH_PATHS } from "@/features/auth/paths";
import { Link } from "@/lib/i18n/navigation";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const { form, onSubmit, submitted, isSubmitting } = useForgotPassword();
  const {
    register,
    formState: { errors },
  } = form;

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <AuthInlineNotice message={t("success")} />
        <Link
          className="text-sm font-bold text-foreground underline-offset-4 hover:underline"
          href={AUTH_PATHS.login}
        >
          {t("loginLink")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FieldGroup className="gap-4">
        <Field data-invalid={errors.email !== undefined || undefined}>
          <FieldLabel htmlFor="email" className="font-semibold">
            {t("email")}
          </FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder={t("emailPlaceholder")}
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            disabled={isSubmitting}
            {...register("email")}
          />
          <FieldError id="email-error" errors={[errors.email]} />
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
      <Link
        className="text-sm font-bold text-foreground underline-offset-4 hover:underline"
        href={AUTH_PATHS.login}
      >
        {t("loginLink")}
      </Link>
    </form>
  );
}
