"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV, isActiveAdminPath } from "@/features/navigation/admin-nav";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

export function AdminSidebar({
  actorEmail,
  actorRole,
}: {
  actorEmail: string;
  actorRole: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <p className="font-semibold">SoHappyPDF Admin</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? "Close" : "Menu"}
        </Button>
      </div>
      <aside
        className={cn(
          "flex shrink-0 flex-col bg-sidebar text-sidebar-foreground",
          mobileOpen ? "flex" : "hidden lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex items-center justify-between px-3 py-3">
          {collapsed ? (
            <span className="text-sm font-semibold">S</span>
          ) : (
            <div>
              <p className="text-sm font-semibold">SoHappyPDF</p>
              <p className="text-[11px] text-sidebar-muted">Admin</p>
            </div>
          )}
          <button
            type="button"
            className="hidden rounded-md px-2 py-1 text-xs text-sidebar-muted hover:bg-sidebar-active lg:inline"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
          {ADMIN_NAV.map((section) => (
            <div key={section.label}>
              {collapsed ? null : (
                <p className="px-2 pb-1 text-[10px] font-medium tracking-wide text-sidebar-muted uppercase">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActiveAdminPath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-md px-2 py-1.5 text-sm no-underline",
                        active
                          ? "bg-sidebar-active text-sidebar-foreground"
                          : "text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground",
                      )}
                      title={item.label}
                    >
                      {collapsed ? item.label.slice(0, 1) : item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-3 py-3">
          {collapsed ? null : (
            <>
              <p className="truncate text-xs">{actorEmail}</p>
              <p className="text-[11px] text-sidebar-muted uppercase">
                {actorRole}
              </p>
            </>
          )}
          <button
            type="button"
            className="mt-2 text-xs text-sidebar-muted hover:text-sidebar-foreground"
            onClick={() => {
              void authClient.signOut().then(() => {
                router.replace("/login");
                router.refresh();
              });
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
