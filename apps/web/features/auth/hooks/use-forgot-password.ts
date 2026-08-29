"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authActions } from "@/features/auth/api/auth-actions";
import { firstFormErrorMessage } from "@/features/auth/lib/first-form-error-message";
import {
  createForgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/features/auth/schemas/forgot-password-schema";

export function useForgotPassword() {
  const t = useTranslations("auth.forgotPassword");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(createForgotPasswordSchema(tValidation)),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = form.handleSubmit(
    async (values) => {
      const result = await authActions.requestPasswordReset({
        email: values.email,
      });

      if (!result.ok) {
        toast.error(tErrors(result.messageKey));
        return;
      }

      toast.success(t("success"));
      setSubmitted(true);
    },
    (errors) => {
      const message = firstFormErrorMessage(errors);
      if (message !== undefined) {
        toast.error(message);
      }
    },
  );

  return {
    form,
    onSubmit,
    submitted,
    isSubmitting: form.formState.isSubmitting,
  };
}
