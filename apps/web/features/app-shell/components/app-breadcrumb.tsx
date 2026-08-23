"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { resolveAppBreadcrumb } from "../lib/resolve-app-breadcrumb";

export function AppBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations("appShell.nav");
  const current = resolveAppBreadcrumb(pathname);

  const tShell = useTranslations("appShell");

  return (
    <nav aria-label={tShell("breadcrumb")}>
      <ol className="flex items-center text-sm">
        <li>
          <Link
            href={current.href}
            aria-current="page"
            className="font-medium text-foreground"
          >
            {t(current.id)}
          </Link>
        </li>
      </ol>
    </nav>
  );
}
