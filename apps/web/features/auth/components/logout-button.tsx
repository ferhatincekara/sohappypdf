"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/use-logout";

export function LogoutButton() {
  const t = useTranslations("app");
  const { logout, isPending } = useLogout();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        void logout();
      }}
    >
      {isPending ? t("loggingOut") : t("logout")}
    </Button>
  );
}
