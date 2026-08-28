import type { ReactNode } from "react";
import { AccountSubnav } from "@/features/app-shell";
import { toAppShellUser } from "@/features/app-shell/lib/to-app-shell-user";
import { requireWebSession } from "@/features/auth/session/require-web-session";
import { MarketingShell } from "@/features/marketing/components/marketing-shell";

export default async function AuthenticatedAccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireWebSession();

  return (
    <MarketingShell user={toAppShellUser(session.user)}>
      <main
        id="main-content"
        tabIndex={-1}
        className="relative flex-1 pt-16 md:pt-20 outline-none"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
          <AccountSubnav />
          {children}
        </div>
      </main>
    </MarketingShell>
  );
}
