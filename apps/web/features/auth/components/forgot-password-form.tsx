"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/navigation";
import { useForgotPassword } from "../hooks/use-forgot-password";
import { AUTH_PATHS } from "../paths";
import { AuthFormError } from "./auth-form-error";

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const { form, onSubmit, formError, submitted, isSubmitting } =
    useForgotPassword();
  const {
    register,
    formState: { errors },
  } = form;

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <Alert>
          <AlertDescription>{t("success")}</AlertDescription>
        </Alert>
        <Link
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          href={AUTH_PATHS.login}
        >
          {t("loginLink")}
        </Link>
      </div>
    );
  }

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
