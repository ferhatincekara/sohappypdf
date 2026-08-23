"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useLogout } from "../hooks/use-logout";
import { AuthFormError } from "./auth-form-error";

export function LogoutButton() {
  const t = useTranslations("app");
  const { logout, isPending, error } = useLogout();

  return (
    <div className="flex flex-col items-end gap-2">
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
      <AuthFormError message={error} />
    </div>
  );
}
