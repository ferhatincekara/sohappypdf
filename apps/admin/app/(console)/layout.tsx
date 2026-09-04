import type { ReactNode } from "react";
import { AdminSearch } from "@/features/search/admin-search";
import { AdminSidebar } from "@/features/shell/admin-sidebar";
import { searchAdminAction } from "@/server/actions/search";
import { requireAdmin } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const actor = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AdminSidebar actorEmail={actor.email} actorRole={actor.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:sticky lg:top-0 lg:z-20">
          <AdminSearch search={searchAdminAction} />
        </header>
        <main className="flex-1 space-y-6 overflow-x-hidden px-4 py-5 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
