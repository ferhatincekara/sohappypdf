import type { ReactNode } from "react";
import type { AppShellUser } from "@/features/app-shell";
import { MarketingCanvas } from "./marketing-canvas";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";

export function MarketingShell({
  user,
  children,
}: {
  user: AppShellUser | null;
  children: ReactNode;
}) {
  return (
    <MarketingCanvas>
      <MarketingHeader user={user} />
      {children}
      <MarketingFooter />
    </MarketingCanvas>
  );
}
