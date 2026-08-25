import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell } from "@/features/app-shell";
import { requireWebSession } from "@/features/auth/session/require-web-session";

export default async function AuthenticatedAccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireWebSession();
  const t = await getTranslations("marketing.nav");

  return (
    <>
      <a
        href="#account-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t("skip")}
      </a>
      <AppShell
        user={{
          name: session.user.name,
          email: session.user.email,
        }}
      >
        {children}
      </AppShell>
    </>
  );
}
