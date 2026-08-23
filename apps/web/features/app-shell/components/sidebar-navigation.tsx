"use client";

import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  type AppNavItem,
  PRIMARY_APP_NAVIGATION,
  SECONDARY_APP_NAVIGATION,
} from "../config/navigation";
import { isNavItemActive } from "../lib/is-nav-item-active";

function NavigationList({
  items,
  onNavigate,
}: {
  items: readonly AppNavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("appShell.nav");

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(pathname, item.href);

        return (
          <li key={item.id}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                buttonVariants({
                  variant: active ? "secondary" : "ghost",
                  size: "sm",
                }),
                "w-full justify-start gap-2",
              )}
            >
              <Icon aria-hidden="true" />
              {t(item.id)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SidebarNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("appShell");

  return (
    <nav
      aria-label={t("navigation")}
      className="flex flex-1 flex-col gap-6 px-3"
    >
      <NavigationList items={PRIMARY_APP_NAVIGATION} onNavigate={onNavigate} />
      <NavigationList
        items={SECONDARY_APP_NAVIGATION}
        onNavigate={onNavigate}
      />
    </nav>
  );
}
