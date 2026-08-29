"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authActions } from "@/features/auth/api/auth-actions";
import { firstFormErrorMessage } from "@/features/auth/lib/first-form-error-message";
import { AUTH_PATHS } from "@/features/auth/paths";
import {
  createResetPasswordSchema,
  type ResetPasswordValues,
} from "@/features/auth/schemas/reset-password-schema";
import { useRouter } from "@/lib/i18n/navigation";

export function useResetPassword(token: string) {
  const t = useTranslations("auth.resetPassword");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(createResetPasswordSchema(tValidation)),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(
    async (values) => {
      const result = await authActions.resetPassword({
        password: values.password,
        token,
      });

      if (!result.ok) {
        toast.error(tErrors(result.messageKey));
        return;
      }

      toast.success(t("updated"));
      router.replace(AUTH_PATHS.login);
      router.refresh();
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
