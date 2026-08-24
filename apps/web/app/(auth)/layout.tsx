import type { ReactNode } from "react";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { hasWebSession } from "@/features/auth/session/session-state";
import { MarketingShell } from "@/features/marketing/components/marketing-shell";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getWebSession();

  return (
    <MarketingShell isAuthenticated={hasWebSession(session)}>
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-10"
      >
        {children}
      </main>
    </MarketingShell>
  );
}
