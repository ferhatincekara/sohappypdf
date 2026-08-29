"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { authActions } from "@/features/auth/api/auth-actions";
import { AUTH_PATHS } from "@/features/auth/paths";
import { useRouter } from "@/lib/i18n/navigation";

export function useLogout() {
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function logout() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    const result = await authActions.signOut();

    if (!result.ok) {
      toast.error(tErrors(result.messageKey));
      setIsPending(false);
      return;
    }

    router.replace(AUTH_PATHS.home);
    router.refresh();
  }

  return {
    logout,
    isPending,
  };
}
