"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/i18n/navigation";
import { authActions } from "../api/auth-actions";
import { resolvePostAuthPath } from "../safe-redirect";
import {
  createRegisterSchema,
  type RegisterValues,
} from "../schemas/register-schema";

export function useRegister(next?: string | null) {
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(createRegisterSchema(tValidation)),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await authActions.signUpWithEmail({
      email: values.email,
      password: values.password,
    });

    if (!result.ok) {
      setFormError(tErrors(result.messageKey));
      return;
    }

    router.replace(resolvePostAuthPath(next));
    router.refresh();
  });

  return {
    form,
    onSubmit,
    formError,
    isSubmitting: form.formState.isSubmitting,
  };
}
