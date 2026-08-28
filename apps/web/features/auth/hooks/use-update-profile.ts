"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { authActions } from "../api/auth-actions";
import { firstFormErrorMessage } from "../lib/first-form-error-message";
import {
  createUpdateProfileSchema,
  type UpdateProfileValues,
} from "../schemas/update-profile-schema";

export function useUpdateProfile(initial: UpdateProfileValues) {
  const tSettings = useTranslations("settings.profile");
  const tValidation = useTranslations("auth.validation");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const form = useForm<UpdateProfileValues>({
    resolver: zodResolver(createUpdateProfileSchema(tValidation)),
    defaultValues: initial,
  });

  const onSubmit = form.handleSubmit(
    async (values) => {
      const name = values.name.trim();
      const email = values.email.trim().toLowerCase();
      const initialEmail = initial.email.trim().toLowerCase();

      if (name !== initial.name.trim()) {
        const result = await authActions.updateUser({ name });
        if (!result.ok) {
          toast.error(tErrors(result.messageKey));
          return;
        }
      }

      if (email !== initialEmail) {
        const result = await authActions.changeEmail({ email });
        if (!result.ok) {
          toast.error(tErrors(result.messageKey));
          return;
        }
      }

      form.reset({ name, email });
      toast.success(tSettings("updated"));
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
