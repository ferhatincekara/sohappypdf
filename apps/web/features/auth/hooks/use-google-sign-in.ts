"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { authActions } from "@/features/auth/api/auth-actions";
import { AUTH_PATHS } from "@/features/auth/paths";

export function useGoogleSignIn(input: {
  next?: string | null;
  errorPath?: string;
}) {
  const tErrors = useTranslations("auth.errors");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signInWithGoogle() {
    setIsSubmitting(true);

    const result = await authActions.signInWithGoogle({
      next: input.next,
      errorPath: input.errorPath ?? AUTH_PATHS.login,
    });

    if (!result.ok) {
      setIsSubmitting(false);
      toast.error(tErrors(result.messageKey));
    }
  }

  return {
    signInWithGoogle,
    isSubmitting,
  };
}
