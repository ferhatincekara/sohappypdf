import type { ReactNode } from "react";
import { toAppShellUser } from "@/features/app-shell/lib/to-app-shell-user";
import { getWebSession } from "@/features/auth/session/get-web-session";
import { MarketingShell } from "@/features/marketing/components/marketing-shell";

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getWebSession();
  const user = session === null ? null : toAppShellUser(session.user);

  return (
    <MarketingShell user={user}>
      <main
        id="main-content"
        tabIndex={-1}
        className="relative flex-1 pt-16 md:pt-20 outline-none"
      >
        {children}
      </main>
    </MarketingShell>
  );
}
