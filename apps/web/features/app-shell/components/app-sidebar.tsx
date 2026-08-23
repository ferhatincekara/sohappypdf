import type { AppShellUser } from "../types";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNavigation } from "./sidebar-navigation";

export function AppSidebar({ user }: { user: AppShellUser }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
      <SidebarHeader />
      <SidebarNavigation />
      <SidebarFooter user={user} />
    </aside>
  );
}
