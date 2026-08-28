"use client";

import { useTranslations } from "next-intl";
import { PillTabs } from "@/components/ui/pill-tabs";
import { usePathname } from "@/lib/i18n/navigation";
import { APP_NAVIGATION } from "../config/navigation";
import { isNavItemActive } from "../lib/is-nav-item-active";

export function AccountSubnav() {
  const t = useTranslations("appShell");
  const pathname = usePathname();
  const activeId =
    APP_NAVIGATION.find((item) => isNavItemActive(pathname, item.href))?.id ??
    "activity";

  return (
    <PillTabs
      layoutId="account-subnav"
      aria-label={t("accountNav")}
      value={activeId}
      items={APP_NAVIGATION.map((item) => ({
        id: item.id,
        label: t(`nav.${item.id}`),
        href: item.href,
      }))}
    />
  );
}
