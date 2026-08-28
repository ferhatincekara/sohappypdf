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
import { PasswordInput } from "./password-input";

export function LoginForm({ next }: { next?: string | null }) {
  const t = useTranslations("auth.login");
  const tFields = useTranslations("auth.fields");
  const { form, onSubmit, isSubmitting } = useLogin(next);
  const {
    register,
    formState: { errors },
  } = form;

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
        <Field data-invalid={errors.password !== undefined || undefined}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
            <FieldLabel
              htmlFor="password"
              className="col-start-1 row-start-1 font-semibold"
            >
              {t("password")}
            </FieldLabel>
            <div className="col-span-2 row-start-2">
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder={t("passwordPlaceholder")}
                aria-invalid={errors.password !== undefined}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                disabled={isSubmitting}
                showLabel={tFields("showPassword")}
                hideLabel={tFields("hidePassword")}
                {...register("password")}
              />
            </div>
            <Link
              className="col-start-2 row-start-1 text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              href={AUTH_PATHS.forgotPassword}
            >
              {t("forgotLink")}
            </Link>
          </div>
          <FieldError id="password-error" errors={[errors.password]} />
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
      <p className="text-sm text-muted-foreground">
        {t("switchHint")}{" "}
        <Link
          className="font-bold text-foreground underline-offset-4 hover:underline"
          href={next ? signupPath(next) : AUTH_PATHS.signup}
        >
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
