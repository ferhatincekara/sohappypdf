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
    <div className="flex min-h-dvh">
      <AdminSidebar actorEmail={actor.email} actorRole={actor.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <AdminSearch search={searchAdminAction} />
        </header>
        <main className="flex-1 space-y-5 overflow-x-hidden p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
