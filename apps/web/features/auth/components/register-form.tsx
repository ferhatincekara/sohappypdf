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
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { PasswordInput } from "@/features/auth/components/password-input";
import { useOAuthErrorToast } from "@/features/auth/hooks/use-oauth-error-toast";
import { useRegister } from "@/features/auth/hooks/use-register";
import { AUTH_PATHS, loginPath } from "@/features/auth/paths";
import { Link } from "@/lib/i18n/navigation";

export function RegisterForm({
  next,
  oauthError,
}: {
  next?: string | null;
  oauthError?: string | null;
}) {
  const t = useTranslations("auth.register");
  const tFields = useTranslations("auth.fields");
  const { form, onSubmit, isSubmitting } = useRegister(next);
  const {
    register,
    formState: { errors },
  } = form;

  useOAuthErrorToast(oauthError);

  return (
    <div className="flex flex-col gap-5">
      <GoogleSignInButton
        next={next}
        errorPath={AUTH_PATHS.signup}
        disabled={isSubmitting}
      />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FieldGroup className="gap-4">
          <Field data-invalid={errors.name !== undefined || undefined}>
            <FieldLabel htmlFor="name" className="font-semibold">
              {t("name")}
            </FieldLabel>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              autoFocus
              placeholder={t("namePlaceholder")}
              aria-invalid={errors.name !== undefined}
              aria-describedby={errors.name ? "name-error" : undefined}
              disabled={isSubmitting}
              {...register("name")}
            />
            <FieldError id="name-error" errors={[errors.name]} />
          </Field>
          <Field data-invalid={errors.email !== undefined || undefined}>
            <FieldLabel htmlFor="email" className="font-semibold">
              {t("email")}
            </FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              aria-invalid={errors.email !== undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isSubmitting}
              {...register("email")}
            />
            <FieldError id="email-error" errors={[errors.email]} />
          </Field>
          <Field data-invalid={errors.password !== undefined || undefined}>
            <FieldLabel htmlFor="password" className="font-semibold">
              {t("password")}
            </FieldLabel>
            <PasswordInput
              id="password"
              autoComplete="new-password"
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
          <Field
            data-invalid={errors.confirmPassword !== undefined || undefined}
          >
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
          variant="secondary"
          className="mt-1 w-full"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t("switchHint")}{" "}
          <Link
            className="font-bold text-foreground underline-offset-4 hover:underline"
            href={next ? loginPath(next) : AUTH_PATHS.login}
          >
            {t("loginLink")}
          </Link>
        </p>
      </form>
    </div>
  );
}
