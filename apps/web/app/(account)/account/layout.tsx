import type { ReactNode } from "react";
import { AppShell } from "@/features/app-shell";
import { requireWebSession } from "@/features/auth/session/require-web-session";

export default async function AuthenticatedAccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireWebSession();

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    >
      {children}
    </AppShell>
  );
}
