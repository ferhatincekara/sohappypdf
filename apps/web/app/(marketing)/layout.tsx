import type { ReactNode } from "react";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { hasWebSession } from "@/features/auth/session/session-state";
import { MarketingShell } from "@/features/marketing/components/marketing-shell";

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getWebSession();

  return (
    <MarketingShell isAuthenticated={hasWebSession(session)}>
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </MarketingShell>
  );
}
