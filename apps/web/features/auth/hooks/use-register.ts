"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authActions } from "@/features/auth/api/auth-actions";
import { firstFormErrorMessage } from "@/features/auth/lib/first-form-error-message";
import { resolvePostAuthPath } from "@/features/auth/safe-redirect";
import {
  createRegisterSchema,
  type RegisterValues,
} from "@/features/auth/schemas/register-schema";
import { useRouter } from "@/lib/i18n/navigation";

export function useRegister(next?: string | null) {
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(createRegisterSchema(tValidation)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(
    async (values) => {
      const result = await authActions.signUpWithEmail({
        name: values.name,
        email: values.email,
        password: values.password,
      });

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
