"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authActions } from "@/features/auth/api/auth-actions";
import { firstFormErrorMessage } from "@/features/auth/lib/first-form-error-message";
import {
  type ChangePasswordValues,
  createChangePasswordSchema,
} from "@/features/auth/schemas/change-password-schema";

export function useChangePassword() {
  const tSettings = useTranslations("settings.password");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(createChangePasswordSchema(tValidation)),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(
    async (values) => {
      const result = await authActions.changePassword({
        currentPassword: values.currentPassword,
        password: values.password,
      });

      if (!result.ok) {
        toast.error(tErrors(result.messageKey));
        return;
      }

      form.reset();
      toast.success(tSettings("updated"));
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
    isSubmitting: form.formState.isSubmitting,
  };
}
