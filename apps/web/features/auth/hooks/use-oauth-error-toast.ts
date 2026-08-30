"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { mapOAuthCallbackError } from "@/features/auth/api/auth-errors";

export function useOAuthErrorToast(error?: string | null) {
  const tErrors = useTranslations("auth.errors");
  const shownError = useRef<string | null>(null);

  useEffect(() => {
    if (error === undefined || error === null || error === shownError.current) {
      return;
    }

    const messageKey = mapOAuthCallbackError(error);

    if (messageKey === undefined) {
      return;
    }

    shownError.current = error;
    toast.error(tErrors(messageKey));
  }, [error, tErrors]);
}
