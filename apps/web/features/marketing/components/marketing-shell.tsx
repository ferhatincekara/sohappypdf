import type { ReactNode } from "react";
import type { AppShellUser } from "@/features/app-shell";
import { MarketingCanvas } from "@/features/marketing/components/marketing-canvas";
import { MarketingFooter } from "@/features/marketing/components/marketing-footer";
import { MarketingHeader } from "@/features/marketing/components/marketing-header";

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
