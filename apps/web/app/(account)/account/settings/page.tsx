import type { Metadata } from "next";
import { buildAccountPageMetadata } from "@/features/app-shell/lib/account-page-metadata";
import { toAppShellUser } from "@/features/app-shell/lib/to-app-shell-user";
import { requireWebSession } from "@/features/auth/session/require-web-session";
import { SettingsPageContent } from "@/features/settings/components/settings-page-content";

export async function generateMetadata(): Promise<Metadata> {
  return buildAccountPageMetadata("settings");
}

export default async function SettingsPage() {
  const session = await requireWebSession();

  return <SettingsPageContent user={toAppShellUser(session.user)} />;
}
