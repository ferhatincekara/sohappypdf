"use client";

import { Separator } from "@/components/ui/separator";
import type { AppShellUser } from "../types";
import { UserMenu } from "./user-menu";

export function SidebarFooter({ user }: { user: AppShellUser }) {
  return (
    <div className="mt-auto flex flex-col gap-3 p-3">
      <Separator />
      <UserMenu user={user} align="start" />
    </div>
  );
}
