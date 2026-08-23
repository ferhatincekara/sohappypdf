import type { AppShellUser } from "../types";
import { AppBreadcrumb } from "./app-breadcrumb";
import { MobileSidebar } from "./mobile-sidebar";
import { UserMenu } from "./user-menu";

export function AppTopbar({ user }: { user: AppShellUser }) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-border px-4">
      <MobileSidebar user={user} />
      <div className="min-w-0 flex-1">
        <AppBreadcrumb />
      </div>
      <div className="md:hidden">
        <UserMenu user={user} compact />
      </div>
    </header>
  );
}
