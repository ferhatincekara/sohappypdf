"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { resolveProHref } from "@/features/marketing/lib/marketing-cta";
import { authClient } from "@/lib/auth/auth-client";
import { Link } from "@/lib/i18n/navigation";
import type { PublicToolErrorKey } from "../lib/public-tool-errors";

export function ToolUpgradeCard({
  errorKey,
}: {
  errorKey: PublicToolErrorKey;
}) {
  const t = useTranslations("publicTools");
  const session = authClient.useSession();
  const isAuthenticated = session.data !== null && session.data !== undefined;

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-muted p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:p-6">
      <div className="min-w-0">
        <p className="text-base font-extrabold tracking-tight">
          {t("errors.upgradeTitle")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          {errorKey === "tooManyPages"
            ? t("errors.tooManyPagesHint")
            : t(`errors.${errorKey}`)}
        </p>
      </div>
      <Button
        nativeButton={false}
        className="shrink-0"
        render={<Link href={resolveProHref(isAuthenticated)} />}
      >
        {t("errors.upgradeCta")}
      </Button>
    </div>
  );
}
