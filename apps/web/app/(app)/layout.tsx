import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { requireWebSession } from "@/features/auth/session/require-web-session";

export default async function ApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireWebSession();
  const t = await getTranslations("app");

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium">{t("authenticated")}</p>
        <LogoutButton />
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
