"use client";

import { useTranslations } from "next-intl";
import { APP_PATHS } from "@/features/app-shell";
import { Link } from "@/lib/i18n/navigation";

export function BillingUpgradeLink() {
  const t = useTranslations("billing");

  return (
    <Link href={APP_PATHS.billing} className="underline underline-offset-4">
      {t("upgrade")}
    </Link>
  );
}
