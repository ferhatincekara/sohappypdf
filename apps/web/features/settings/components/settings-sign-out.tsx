"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/use-logout";

export function SettingsSignOut() {
  const t = useTranslations("settings.session");
  const tShell = useTranslations("appShell");
  const { logout, isPending } = useLogout();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        void logout();
      }}
    >
      {isPending ? tShell("loggingOut") : t("logout")}
    </Button>
  );
}
