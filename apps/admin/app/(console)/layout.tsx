import type { ReactNode } from "react";
import { resolveAvatarUrl } from "@/features/identity/gravatar-url";
import { AdminSearch } from "@/features/search/admin-search";
import { AdminSidebar } from "@/features/shell/admin-sidebar";
import { requireAdmin } from "@/server/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const actor = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <AdminSidebar
        actorEmail={actor.email}
        actorRole={actor.role}
        actorImageUrl={resolveAvatarUrl(actor.email, actor.image)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-sm">
          <AdminSearch />
        </header>
        <main className="flex-1 space-y-6 overflow-x-hidden px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
