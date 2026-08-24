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
import { useLogin } from "../hooks/use-login";
import { AUTH_PATHS, signupPath } from "../paths";
import { AuthFormError } from "./auth-form-error";

export function LoginForm({ next }: { next?: string | null }) {
  const t = useTranslations("auth.login");
  const { form, onSubmit, formError, isSubmitting } = useLogin(next);
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
            autoComplete="current-password"
            aria-invalid={errors.password !== undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            disabled={isSubmitting}
            {...register("password")}
          />
          <FieldError id="password-error" errors={[errors.password]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
      <div className="flex flex-col gap-2 text-sm">
        <Link
          className="text-muted-foreground underline-offset-4 hover:underline"
          href={AUTH_PATHS.forgotPassword}
        >
          {t("forgotLink")}
        </Link>
        <Link
          className="text-muted-foreground underline-offset-4 hover:underline"
          href={next ? signupPath(next) : AUTH_PATHS.signup}
        >
          {t("registerLink")}
        </Link>
      </div>
    </form>
  );
}
