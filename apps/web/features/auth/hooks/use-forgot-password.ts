"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { authActions } from "../api/auth-actions";
import {
  createForgotPasswordSchema,
  type ForgotPasswordValues,
} from "../schemas/forgot-password-schema";

export function useForgotPassword() {
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(createForgotPasswordSchema(tValidation)),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await authActions.requestPasswordReset({
      email: values.email,
    });

    if (!result.ok) {
      setFormError(tErrors(result.messageKey));
      return;
    }

    setSubmitted(true);
  });

  return {
    form,
    onSubmit,
    formError,
    submitted,
    isSubmitting: form.formState.isSubmitting,
  };
}
