"use client";

import {
  Activity,
  ChartNoAxesColumn,
  ChevronsLeft,
  ChevronsRight,
  Cpu,
  CreditCard,
  HardDrive,
  KeyRound,
  Layers,
  LayoutDashboard,
  Menu,
  ScrollText,
  Settings,
  UserRound,
  Users,
  Workflow,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/features/identity/user-avatar";
import {
  ADMIN_NAV,
  type AdminNavIcon,
  isActiveAdminPath,
} from "@/features/navigation/admin-nav";
import { AdminMark } from "@/features/shell/admin-mark";
import { BrandLogo } from "@/features/shell/brand-logo";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<AdminNavIcon, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  users: Users,
  anonymous: UserRound,
  executions: Workflow,
  queues: Layers,
  workers: Cpu,
  tools: Wrench,
  billing: CreditCard,
  api: KeyRound,
  usage: ChartNoAxesColumn,
  storage: HardDrive,
  system: Activity,
  audit: ScrollText,
  settings: Settings,
};

export function AdminSidebar({
  actorEmail,
  actorRole,
  actorImageUrl,
}: {
  actorEmail: string;
  actorRole: string;
  actorImageUrl: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const navigation = (
    <>
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {collapsed ? (
            <AdminMark className="size-7" />
          ) : (
            <div className="min-w-0">
              <BrandLogo
                title="SoHappyPDF"
                className="h-7 w-auto text-sidebar-foreground"
                markClassName="fill-primary"
              />
              <p className="mt-1 text-[11px] text-sidebar-muted">Operations</p>
            </div>
          )}
        </div>
        <button
          type="button"
          className="hidden rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground lg:inline-flex"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </button>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-2 pb-4">
        {ADMIN_NAV.map((section) => (
          <div key={section.label}>
            {collapsed ? null : (
              <p className="px-2 pb-1.5 text-[10px] font-medium tracking-[0.14em] text-sidebar-muted uppercase">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActiveAdminPath(pathname, item.href);
                const Icon = NAV_ICONS[item.icon];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm no-underline transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-sidebar-active text-sidebar-foreground"
                        : "text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground",
                    )}
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="size-4 shrink-0" />
                    {collapsed ? (
                      <span className="sr-only">{item.label}</span>
                    ) : (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed && "justify-center",
          )}
        >
          <UserAvatar
            src={actorImageUrl}
            label={actorEmail}
            className="bg-sidebar-active text-sidebar-foreground"
          />
          {collapsed ? null : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs">{actorEmail}</p>
              <p className="text-[11px] text-sidebar-muted uppercase">
                {actorRole}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          className={cn(
            "mt-3 w-full rounded-md px-2 py-2 text-left text-xs text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground",
            collapsed && "text-center",
          )}
          onClick={() => {
            void authClient.signOut().then(() => {
              router.replace("/login");
              router.refresh();
            });
          }}
        >
          {collapsed ? "Out" : "Sign out"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo
            title="SoHappyPDF"
            className="h-6 w-auto"
            markClassName="fill-primary"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-10 min-w-10"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-nav"
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          <span className="sr-only">
            {mobileOpen ? "Close menu" : "Open menu"}
          </span>
        </Button>
      </div>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <aside
        id="admin-mobile-nav"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col bg-sidebar text-sidebar-foreground lg:static lg:z-auto lg:flex",
          mobileOpen ? "flex" : "hidden lg:flex",
          collapsed ? "lg:w-16" : "lg:w-60",
        )}
      >
        {navigation}
      </aside>
    </>
  );
}
