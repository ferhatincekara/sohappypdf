"use client";

import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/lib/i18n/navigation";
import { MARKETING_NAV_LINKS } from "../lib/marketing-nav";
import { MARKETING_PATHS } from "../lib/marketing-paths";
import { getMarketingToolShortcuts } from "../lib/marketing-tool-shortcuts";
import {
  isMobileNavEscapeKey,
  resolveMobileNavOpen,
} from "../lib/mobile-nav-state";

export function MarketingMobileNav({
  startHref,
  signInHref,
  startLabel,
  signInLabel,
  isAuthenticated,
}: {
  startHref: string;
  signInHref: string;
  startLabel: string;
  signInLabel: string;
  isAuthenticated: boolean;
}) {
  const t = useTranslations("marketing.nav");
  const [open, setOpen] = useState(false);
  const shortcuts = getMarketingToolShortcuts();

  function close(action: "close" | "escape" | "navigate") {
    setOpen(resolveMobileNavOpen(open, action));
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
      }}
    >
      <SheetTrigger
        render={<Button variant="ghost" size="icon-sm" className="md:hidden" />}
        aria-label={t("open")}
        aria-expanded={open}
        aria-controls="marketing-mobile-nav"
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent
        id="marketing-mobile-nav"
        side="right"
        closeLabel={t("close")}
        className="p-0"
        onKeyDown={(event) => {
          if (isMobileNavEscapeKey(event.key)) {
            close("escape");
          }
        }}
      >
        <SheetHeader className="h-14 justify-center border-b border-border">
          <SheetTitle>
            <Link
              href={MARKETING_PATHS.home}
              onClick={() => {
                close("navigate");
              }}
            >
              {t("brand")}
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label={t("menu")} className="flex flex-col gap-1 p-4">
          <p className="px-2 text-xs font-medium text-muted-foreground">
            {t("shortcuts.label")}
          </p>
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.id}
              href={shortcut.href}
              onClick={() => {
                close("navigate");
              }}
              className={buttonVariants({
                variant: "ghost",
                className: "justify-start",
              })}
            >
              {t(`shortcuts.${shortcut.id}`)}
            </Link>
          ))}
          <Link
            href={MARKETING_PATHS.tools}
            onClick={() => {
              close("navigate");
            }}
            className={buttonVariants({
              variant: "ghost",
              className: "justify-start font-medium",
            })}
          >
            {t("allTools")}
          </Link>
          {MARKETING_NAV_LINKS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => {
                close("navigate");
              }}
              className={buttonVariants({
                variant: "ghost",
                className: "justify-start",
              })}
            >
              {t(item.id)}
            </Link>
          ))}
          {isAuthenticated ? null : (
            <Link
              href={signInHref}
              onClick={() => {
                close("navigate");
              }}
              className={buttonVariants({
                variant: "ghost",
                className: "justify-start",
              })}
            >
              {signInLabel}
            </Link>
          )}
          <Link
            href={startHref}
            onClick={() => {
              close("navigate");
            }}
            className={buttonVariants({ className: "mt-2 justify-center" })}
          >
            {startLabel}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
