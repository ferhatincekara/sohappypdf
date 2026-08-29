"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  type PublicToolErrorKey,
  publicToolErrorMessageValues,
} from "@/features/public-tools/lib/public-tool-errors";

export const TOOL_ERROR_TOAST_ID = "public-tool-error";

export function useToolErrorToast(
  errorKey: PublicToolErrorKey | null,
  maxPagesPerFile: number | null = null,
) {
  const t = useTranslations("publicTools");
  const shownKey = useRef<PublicToolErrorKey | null>(null);

  useEffect(() => {
    if (errorKey === shownKey.current) {
      return;
    }

    shownKey.current = errorKey;

    if (errorKey === null) {
      toast.dismiss(TOOL_ERROR_TOAST_ID);
      return;
    }

    const values = publicToolErrorMessageValues(errorKey, maxPagesPerFile);
    const title =
      errorKey === "tooManyPages"
        ? t("errors.tooManyPagesShort", values)
        : t("errors.title");
    const description =
      errorKey === "tooManyPages"
        ? t("errors.tooManyPagesHint")
        : t(`errors.${errorKey}`, values);

    toast.error(title, {
      id: TOOL_ERROR_TOAST_ID,
      description,
      duration: 7000,
    });
  }, [errorKey, maxPagesPerFile, t]);
}
