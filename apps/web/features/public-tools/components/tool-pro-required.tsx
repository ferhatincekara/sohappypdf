"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resolveProHref } from "@/features/marketing/lib/marketing-cta";
import { Link } from "@/lib/i18n/navigation";

export function ToolProRequired({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const t = useTranslations("publicTools.proRequired");
  const tNav = useTranslations("marketing.nav");

  return (
    <div className="flex flex-col items-start gap-4">
      <Badge variant="secondary">{tNav("pro")}</Badge>
      <h2 className="text-xl font-extrabold tracking-tight">{t("title")}</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {t("description")}
      </p>
      <Button
        nativeButton={false}
        render={<Link href={resolveProHref(isAuthenticated)} />}
      >
        {t("cta")}
      </Button>
    </div>
  );
}
