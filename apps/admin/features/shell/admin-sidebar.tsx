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
  LogOut,
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
          "flex h-14 items-center border-b border-border px-3",
          collapsed ? "justify-center" : "justify-between gap-2",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <AdminMark className="size-8" />
          </button>
        ) : (
          <>
            <Link href="/" className="min-w-0 no-underline">
              <BrandLogo
                title="SoHappyPDF"
                className="h-6 w-auto text-sidebar-foreground"
                markClassName="fill-foreground"
              />
            </Link>
            <button
              type="button"
              className="hidden rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground lg:inline-flex"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="size-4" />
            </button>
          </>
        )}
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        {ADMIN_NAV.map((section) => (
          <div key={section.label}>
            {collapsed ? null : (
              <p className="px-2 pb-1 text-[11px] font-medium text-sidebar-muted">
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
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm no-underline transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-sidebar-active font-medium text-sidebar-foreground"
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
      <div className="border-t border-border p-2">
        <div
          className={cn(
            "flex items-center gap-2 rounded-md px-1 py-1",
            collapsed && "justify-center",
          )}
        >
          <UserAvatar src={actorImageUrl} label={actorEmail} />
          {collapsed ? null : (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{actorEmail}</p>
              <p className="text-[11px] text-sidebar-muted">{actorRole}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          className={cn(
            "mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground",
            collapsed && "justify-center",
          )}
          onClick={() => {
            void authClient.signOut().then(() => {
              router.replace("/login");
              router.refresh();
            });
          }}
        >
          <LogOut className="size-4" />
          {collapsed ? <span className="sr-only">Sign out</span> : "Sign out"}
        </button>
        {collapsed ? (
          <button
            type="button"
            className="mt-1 hidden w-full items-center justify-center rounded-md py-1.5 text-sidebar-muted hover:bg-sidebar-active lg:flex"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <ChevronsRight className="size-4" />
          </button>
        ) : null}
      </div>
    </>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background px-4 lg:hidden">
        <Link href="/" className="no-underline">
          <BrandLogo title="SoHappyPDF" className="h-6 w-auto" />
        </Link>
        <Button
          variant="outline"
          size="icon"
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
          "fixed inset-y-0 left-0 z-50 flex w-[min(16rem,88vw)] flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:static lg:z-auto lg:flex",
          mobileOpen ? "flex" : "hidden lg:flex",
          collapsed ? "lg:w-14" : "lg:w-60",
        )}
      >
        {navigation}
      </aside>
    </>
  );
}
