"use client";

import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { type AppShellUser, UserMenu } from "@/features/app-shell";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { MARKETING_NAV_LINKS } from "../lib/marketing-nav";
import { MARKETING_PATHS } from "../lib/marketing-paths";
import { getMarketingToolIcon } from "../lib/marketing-tool-icon";
import type {
  MarketingToolNavGroup,
  MarketingToolNavItem,
} from "../lib/marketing-tools";
import { isMobileNavEscapeKey } from "../lib/mobile-nav-state";
import { MarketingMenuToggleIcon } from "./marketing-menu-toggle-icon";
import { MarketingMobileNav } from "./marketing-mobile-nav";
import { MarketingToolStatusBadges } from "./marketing-tool-status-badges";

const MEGA_STORIES = [
  {
    toolId: "pdf-to-word",
    image: "/images/marketing/nav-pdf-to-word.jpg",
  },
  {
    toolId: "compress-pdf",
    image: "/images/marketing/hero-team.jpg",
  },
] as const;

export function MarketingHeaderBar({
  user,
  startHref,
  signInHref,
  startLabel,
  signInLabel,
  toolGroups,
}: {
  user: AppShellUser | null;
  startHref: string;
  signInHref: string;
  startLabel: string;
  signInLabel: string;
  toolGroups: readonly MarketingToolNavGroup[];
}) {
  const t = useTranslations("marketing.nav");
  const tTools = useTranslations("tools");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (isMobileNavEscapeKey(event.key)) {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  // Close overlay menus after the route changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the navigation trigger
  useEffect(() => {
    setToolsOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  function openTools() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
    }
    setToolsOpen(true);
  }

  function closeTools() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
    }
    closeTimer.current = window.setTimeout(() => {
      setToolsOpen(false);
    }, 120);
  }

  const navItems = [
    { id: "tools", href: MARKETING_PATHS.tools, hasMenu: true },
    ...MARKETING_NAV_LINKS.map((item) => ({
      id: item.id,
      href: item.href,
      hasMenu: false,
    })),
  ] as const;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <a
        href="#main-content"
        tabIndex={0}
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t("skip")}
      </a>
      <div
        className={cn(
          "relative z-50 h-16 transition-colors duration-300 md:h-20",
          toolsOpen || mobileOpen
            ? "bg-white"
            : scrolled
              ? "bg-white/80 backdrop-blur-xl"
              : "bg-transparent",
        )}
      >
        <div className="mx-auto grid h-full min-w-0 max-w-site grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 md:px-8">
          <Link
            href={MARKETING_PATHS.home}
            className="flex shrink-0 items-center justify-self-start"
          >
            <BrandLogo title={t("brand")} />
          </Link>

          <LayoutGroup id="nav-hover">
            <nav
              aria-label={t("menu")}
              className="relative col-start-2 hidden items-center gap-1 justify-self-center lg:flex"
              onMouseLeave={() => setHovered(null)}
            >
              {navItems.map((item) => {
                const isActive = isActivePath(pathname, item.href);
                const isHot =
                  hovered === item.id ||
                  (item.hasMenu && toolsOpen && hovered === null) ||
                  (isActive && hovered === null && !toolsOpen);

                return (
                  // Hover bridge so the tools mega menu stays open.
                  // biome-ignore lint/a11y/noStaticElementInteractions: hover-intent wrapper for the mega menu
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => {
                      setHovered(item.id);
                      if (item.hasMenu) {
                        openTools();
                      }
                    }}
                    onMouseLeave={() => {
                      if (item.hasMenu) {
                        closeTools();
                      }
                    }}
                  >
                    {isHot ? (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-black/5"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                      />
                    ) : null}
                    <Link
                      href={item.href}
                      className={cn(
                        "relative z-10 flex items-center gap-1 px-3.5 py-2 text-base font-medium transition-colors",
                        isActive
                          ? "text-foreground"
                          : "text-foreground/80 hover:text-foreground",
                      )}
                    >
                      {t(item.id)}
                      {item.hasMenu ? (
                        <ChevronDownIcon
                          className={cn(
                            "size-4 shrink-0 opacity-60 transition-transform duration-200",
                            toolsOpen && "rotate-180",
                          )}
                        />
                      ) : null}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </LayoutGroup>

          <div className="col-start-3 flex shrink-0 items-center justify-end gap-3 justify-self-end">
            {user === null ? (
              <>
                <Link
                  href={signInHref}
                  className="hidden px-3 py-2 text-base font-medium text-foreground md:inline-flex"
                >
                  {signInLabel}
                </Link>
                <Button
                  variant="default"
                  size="sm"
                  className="hidden md:inline-flex"
                  nativeButton={false}
                  render={<Link href={startHref} />}
                >
                  {startLabel}
                </Button>
              </>
            ) : (
              <div className="hidden lg:block">
                <UserMenu user={user} />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-lg"
              className="lg:hidden"
              aria-label={mobileOpen ? t("close") : t("open")}
              aria-expanded={mobileOpen}
              aria-controls="marketing-mobile-nav"
              onClick={() => setMobileOpen((current) => !current)}
            >
              <MarketingMenuToggleIcon open={mobileOpen} />
            </Button>
          </div>
        </div>
      </div>
      <div className="relative z-40 lg:hidden">
        <MarketingMobileNav
          open={mobileOpen}
          onNavigate={() => setMobileOpen(false)}
          user={user}
          startHref={startHref}
          signInHref={signInHref}
          startLabel={startLabel}
          signInLabel={signInLabel}
        />
      </div>

      <AnimatePresence>
        {toolsOpen ? (
          <>
            <motion.button
              type="button"
              tabIndex={-1}
              aria-label={t("close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-16 z-40 hidden bg-black/20 backdrop-blur-md md:top-20 lg:block"
              onClick={() => setToolsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onMouseEnter={openTools}
              onMouseLeave={closeTools}
              className="fixed inset-x-0 top-16 z-50 hidden md:top-20 lg:block"
            >
              <div className="max-h-[calc(100vh-4rem)] overflow-y-auto bg-white md:max-h-[calc(100vh-5rem)]">
                <div className="mx-auto grid max-w-site grid-cols-[minmax(0,1fr)_--spacing(60)] gap-10 px-5 py-8 md:px-8">
                  <div className="grid grid-cols-2 gap-x-5 gap-y-14 lg:grid-cols-4">
                    {toolGroups.map((group) => (
                      <MegaMenuToolGroup
                        key={group.category}
                        group={group}
                        categoryLabel={t(`categories.${group.category}`)}
                        soonLabel={t("comingSoon")}
                        proLabel={t("pro")}
                        toolName={(id) => tTools(`${id}.name`)}
                        onNavigate={() => setToolsOpen(false)}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col gap-3">
                    {MEGA_STORIES.map((story) => {
                      const tool = toolGroups
                        .flatMap((group) => group.tools)
                        .find((item) => item.id === story.toolId);

                      if (
                        tool === undefined ||
                        tool.availability === "planned"
                      ) {
                        return null;
                      }

                      return (
                        <motion.div
                          key={story.toolId}
                          whileHover={{ y: -3 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 24,
                          }}
                        >
                          <Link
                            href={tool.href}
                            onClick={() => setToolsOpen(false)}
                            className="relative block h-35 overflow-hidden rounded-2xl"
                          >
                            <Image
                              src={story.image}
                              alt=""
                              fill
                              sizes="240px"
                              loading="eager"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
                            <p className="absolute inset-x-3 bottom-3 text-[13px] font-semibold leading-snug text-white">
                              {t(`stories.${story.toolId}`)}
                            </p>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

function MegaMenuToolGroup({
  group,
  categoryLabel,
  soonLabel,
  proLabel,
  toolName,
  onNavigate,
}: {
  group: MarketingToolNavGroup;
  categoryLabel: string;
  soonLabel: string;
  proLabel: string;
  toolName: (id: MarketingToolNavItem["id"]) => string;
  onNavigate: () => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="mb-2 text-sm font-bold text-foreground">{categoryLabel}</p>
      <ul>
        {group.tools.slice(0, 6).map((tool) => {
          const Icon = getMarketingToolIcon(tool.icon);
          const isAvailable = tool.availability !== "planned";
          const inner = (
            <>
              <Icon className="mt-0.5 size-4 shrink-0 text-foreground/70" />
              <span className="min-w-0 flex-1 leading-snug">
                {toolName(tool.id)}
              </span>
              <MarketingToolStatusBadges
                availability={tool.availability}
                premium={tool.premium}
                soonLabel={soonLabel}
                proLabel={proLabel}
                className="mt-0.5 shrink-0 self-start"
              />
            </>
          );
          const rowClassName = cn(
            "flex items-start gap-2 py-2 text-base font-medium",
            isAvailable
              ? "text-foreground transition-opacity hover:opacity-60"
              : "text-muted-foreground",
          );

          return (
            <li key={tool.id}>
              {isAvailable ? (
                <Link
                  href={tool.href}
                  className={rowClassName}
                  onClick={onNavigate}
                >
                  {inner}
                </Link>
              ) : (
                <div className={rowClassName}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
