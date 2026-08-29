"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { StatusPageChrome } from "@/features/marketing/components/status-page-chrome";
import { STATUS_PAGE_RECOVERY_LINKS } from "@/features/marketing/lib/marketing-nav";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";

export function StatusPageFrame({ children }: { children: ReactNode }) {
  const tNav = useTranslations("marketing.nav");
  const tFooter = useTranslations("marketing.footer");
  const tErrors = useTranslations("errors");
  const brand = tNav("brand");

  return (
    <StatusPageChrome
      brand={brand}
      renderLogo={() => <BrandLogo title={brand} />}
      homeHref={MARKETING_PATHS.home}
      homeLabel={tErrors("genericHome")}
      menuLabel={tNav("menu")}
      footerMenuLabel={tFooter("menu")}
      skipLabel={tNav("skip")}
      links={STATUS_PAGE_RECOVERY_LINKS.map((item) => ({
        href: item.href,
        label: tNav(item.id),
      }))}
      footerBlurb={tFooter("blurb")}
      copyright={tFooter("copyright", { year: new Date().getFullYear() })}
    >
      {children}
    </StatusPageChrome>
  );
}
