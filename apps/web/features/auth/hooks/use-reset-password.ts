"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/i18n/navigation";
import { authActions } from "../api/auth-actions";
import { AUTH_PATHS } from "../paths";
import {
  createResetPasswordSchema,
  type ResetPasswordValues,
} from "../schemas/reset-password-schema";

export function useResetPassword(token: string) {
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(createResetPasswordSchema(tValidation)),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await authActions.resetPassword({
      password: values.password,
      token,
    });

    if (!result.ok) {
      setFormError(tErrors(result.messageKey));
      return;
    }

    router.replace(AUTH_PATHS.login);
    router.refresh();
  });

  return {
    form,
    onSubmit,
    formError,
    isSubmitting: form.formState.isSubmitting,
  };
}
