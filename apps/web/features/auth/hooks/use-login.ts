"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "@/lib/i18n/navigation";
import { authActions } from "../api/auth-actions";
import { firstFormErrorMessage } from "../lib/first-form-error-message";
import { resolvePostAuthPath } from "../safe-redirect";
import { createLoginSchema, type LoginValues } from "../schemas/login-schema";

export function useLogin(next?: string | null) {
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(createLoginSchema(tValidation)),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(
    async (values) => {
      const result = await authActions.signInWithEmail(values);

      if (!result.ok) {
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
    isSubmitting: form.formState.isSubmitting,
  };
}
