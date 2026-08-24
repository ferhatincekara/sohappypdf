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
import type { MarketingToolNavGroup } from "../lib/marketing-tools";
import {
  isMobileNavEscapeKey,
  resolveMobileNavOpen,
} from "../lib/mobile-nav-state";

export function MarketingMobileNav({
  toolGroups,
  startHref,
  signInHref,
  startLabel,
  signInLabel,
  isAuthenticated,
}: {
  toolGroups: readonly MarketingToolNavGroup[];
  startHref: string;
  signInHref: string;
  startLabel: string;
  signInLabel: string;
  isAuthenticated: boolean;
}) {
  const t = useTranslations("marketing.nav");
  const tTools = useTranslations("tools");
  const [open, setOpen] = useState(false);

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
          <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
            <p className="px-2 text-xs font-medium text-muted-foreground">
              {t("tools")}
            </p>
            {toolGroups.map((group) => (
              <div key={group.category} className="flex flex-col gap-1">
                <p className="px-2 text-xs font-medium text-muted-foreground">
                  {t(`categories.${group.category}`)}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {group.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      onClick={() => {
                        close("navigate");
                      }}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                        className:
                          "h-auto justify-start whitespace-normal px-2 py-1.5 text-left",
                      })}
                    >
                      {tTools(`${tool.id}.name`)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
