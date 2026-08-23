"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/i18n/navigation";
import { authActions } from "../api/auth-actions";
import { AUTH_PATHS } from "../paths";

export function useLogout() {
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setError(null);

    const result = await authActions.signOut();

    if (!result.ok) {
      setError(tErrors(result.messageKey));
      setIsPending(false);
      return;
    }

    router.replace(AUTH_PATHS.home);
    router.refresh();
  }

  return {
    logout,
    isPending,
    error,
  };
}
