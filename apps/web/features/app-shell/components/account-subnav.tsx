"use client";

import { useTranslations } from "next-intl";
import { PillTabs } from "@/components/ui/pill-tabs";
import { APP_NAVIGATION } from "@/features/app-shell/config/navigation";
import { isNavItemActive } from "@/features/app-shell/lib/is-nav-item-active";
import { usePathname } from "@/lib/i18n/navigation";

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
