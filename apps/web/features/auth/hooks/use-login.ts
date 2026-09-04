"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authActions } from "@/features/auth/api/auth-actions";
import {
  AUTH_ERROR_KEYS,
  type AuthErrorKey,
} from "@/features/auth/api/auth-errors";
import { firstFormErrorMessage } from "@/features/auth/lib/first-form-error-message";
import { resolvePostAuthPath } from "@/features/auth/safe-redirect";
import {
  createLoginSchema,
  type LoginValues,
} from "@/features/auth/schemas/login-schema";
import { useRouter } from "@/lib/i18n/navigation";

export function useLogin(next?: string | null) {
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const [authError, setAuthError] = useState<AuthErrorKey | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(createLoginSchema(tValidation)),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(
    async (values) => {
      setAuthError(null);
      const result = await authActions.signInWithEmail(values);

      if (!result.ok) {
        setAuthError(result.messageKey);
        toast.error(tErrors(result.messageKey));
        return;
      }

      router.replace(resolvePostAuthPath(next));
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
    isSuspended: authError === AUTH_ERROR_KEYS.accountSuspended,
    isSubmitting: form.formState.isSubmitting,
  };
}
