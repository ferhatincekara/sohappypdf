import type { ReactNode } from "react";
import { AdminNav } from "./admin-nav";
import { AdminSignOutButton } from "./admin-sign-out-button";

export function AdminShell({
  actor,
  children,
}: {
  actor: { name: string; email: string };
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="border-b border-border px-4 py-4">
          <p className="text-sm font-semibold tracking-tight">Admin</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {actor.email}
          </p>
        </div>
        <AdminNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
          <p className="text-sm font-medium md:hidden">Admin</p>
          <p className="truncate text-sm text-muted-foreground">{actor.name}</p>
          <AdminSignOutButton />
        </header>
        <div className="border-b border-border px-4 py-2 md:hidden">
          <AdminNav />
        </div>
        <main id="admin-main" className="min-w-0 flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
