"use client";

import {
  CircleHelpIcon,
  CodeXmlIcon,
  FileOutputIcon,
  FilesIcon,
  InfoIcon,
  LayoutGridIcon,
  LockIcon,
  LogOutIcon,
  type LucideIcon,
  MailIcon,
  Minimize2Icon,
  NewspaperIcon,
  ScanTextIcon,
  ScissorsIcon,
  TagIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { APP_NAVIGATION, type AppShellUser } from "@/features/app-shell";
import {
  resolveAccountDisplayName,
  resolveAccountInitial,
} from "@/features/app-shell/lib/account-display-name";
import { useLogout } from "@/features/auth/hooks/use-logout";
import {
  MARKETING_MOBILE_MENU_LINKS,
  type MarketingMobileMenuLinkId,
} from "@/features/marketing/lib/marketing-nav";
import {
  getMarketingToolShortcuts,
  type MarketingToolShortcutLabelId,
} from "@/features/marketing/lib/marketing-tool-shortcuts";
import { easeOutExpo } from "@/features/marketing/lib/motion-tokens";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const PAGE_ICONS: Record<MarketingMobileMenuLinkId, LucideIcon> = {
  tools: LayoutGridIcon,
  pricing: TagIcon,
  developers: CodeXmlIcon,
  about: InfoIcon,
  blog: NewspaperIcon,
  faq: CircleHelpIcon,
  contact: MailIcon,
};

const SHORTCUT_ICONS: Record<MarketingToolShortcutLabelId, LucideIcon> = {
  merge: FilesIcon,
  split: ScissorsIcon,
  compress: Minimize2Icon,
  convert: FileOutputIcon,
  ocr: ScanTextIcon,
  protect: LockIcon,
};

const panelTransition = {
  duration: 0.38,
  ease: easeOutExpo,
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
};

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.05 },
  },
};

export function MarketingMobileNav({
  open,
  onNavigate,
  user,
  startHref,
  signInHref,
  startLabel,
  signInLabel,
}: {
  open: boolean;
  onNavigate: () => void;
  user: AppShellUser | null;
  startHref: string;
  signInHref: string;
  startLabel: string;
  signInLabel: string;
}) {
  const t = useTranslations("marketing.nav");
  const tAccount = useTranslations("appShell");
  const pathname = usePathname();
  const { logout, isPending } = useLogout();
  const reduceMotion = useReducedMotion() === true;
  const shortcuts = getMarketingToolShortcuts();
  const displayName =
    user === null ? "" : resolveAccountDisplayName(user.name, user.email);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          id="marketing-mobile-nav"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={reduceMotion ? { duration: 0.15 } : panelTransition}
          className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col bg-white md:top-20 lg:hidden"
        >
          <nav
            aria-label={t("menu")}
            className="mx-auto flex min-h-0 w-full max-w-site flex-1 flex-col"
          >
            <motion.div
              initial={reduceMotion ? false : "hidden"}
              animate="show"
              variants={listVariants}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-8"
            >
              <motion.p
                variants={itemVariants}
                className="mb-3 text-sm font-bold text-muted-foreground"
              >
                {t("shortcuts.label")}
              </motion.p>
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-2"
              >
                {shortcuts.map((shortcut) => {
                  const Icon = SHORTCUT_ICONS[shortcut.id];

                  return (
                    <Link
                      key={shortcut.id}
                      href={shortcut.href}
                      onClick={onNavigate}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-muted px-4 text-sm font-semibold text-foreground"
                    >
                      <Icon className="size-5 shrink-0" />
                      {t(`shortcuts.${shortcut.id}`)}
                    </Link>
                  );
                })}
              </motion.div>

              <motion.ul variants={listVariants} className="mt-8 space-y-1">
                {MARKETING_MOBILE_MENU_LINKS.map((item) => {
                  const Icon = PAGE_ICONS[item.id];
                  const active = isActivePath(pathname, item.href);

                  return (
                    <motion.li key={item.id} variants={itemVariants}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-2 py-3 text-base font-semibold transition-colors",
                          active
                            ? "bg-muted text-foreground"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
                            active ? "bg-white" : "bg-muted",
                          )}
                        >
                          <Icon className="size-5" />
                        </span>
                        {t(item.id)}
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.4, delay: 0.16, ease: easeOutExpo }
              }
              className="border-t border-border px-5 py-4 md:px-8"
            >
              {user === null ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    nativeButton={false}
                    render={<Link href={signInHref} onClick={onNavigate} />}
                  >
                    {signInLabel}
                  </Button>
                  <Button
                    className="flex-1"
                    nativeButton={false}
                    render={<Link href={startHref} onClick={onNavigate} />}
                  >
                    {startLabel}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 after:hidden">
                      <AvatarImage
                        src={user.imageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="bg-secondary text-base font-bold tracking-tight text-foreground">
                        {resolveAccountInitial(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold tracking-tight">
                        {displayName}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {user.email}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {APP_NAVIGATION.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Button
                          key={item.id}
                          variant="outline"
                          className="h-12 justify-start gap-2.5 px-4 text-sm"
                          nativeButton={false}
                          render={
                            <Link href={item.href} onClick={onNavigate} />
                          }
                        >
                          <Icon className="size-5" />
                          {tAccount(`nav.${item.id}`)}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2.5"
                    disabled={isPending}
                    onClick={() => {
                      onNavigate();
                      void logout();
                    }}
                  >
                    <LogOutIcon className="size-5" />
                    {isPending ? tAccount("loggingOut") : tAccount("logout")}
                  </Button>
                </div>
              )}
            </motion.div>
          </nav>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
