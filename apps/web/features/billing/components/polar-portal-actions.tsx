"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function PolarPortalActions({
  canManage,
  isPortalPending,
  onManage,
  tone = "default",
}: {
  canManage: boolean;
  isPortalPending: boolean;
  onManage: () => void;
  tone?: "default" | "onDark";
}) {
  const t = useTranslations("billing");

  if (!canManage) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={tone === "onDark" ? "white" : "outline"}
      slideLabel={false}
      title={t("portalHint")}
      disabled={isPortalPending}
      aria-busy={isPortalPending}
      onClick={onManage}
    >
      {isPortalPending ? t("openingPortal") : t("manage")}
    </Button>
  );
}
