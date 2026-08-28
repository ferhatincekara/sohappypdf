import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AccountPageHeader, type AppShellUser } from "@/features/app-shell";
import {
  resolveAccountDisplayName,
  resolveAccountInitial,
} from "@/features/app-shell/lib/account-display-name";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { UpdateProfileForm } from "@/features/auth/components/update-profile-form";
import { LocaleSwitcher } from "@/features/marketing/components/locale-switcher";
import { SettingsCard } from "./settings-card";
import { SettingsSignOut } from "./settings-sign-out";

export async function SettingsPageContent({ user }: { user: AppShellUser }) {
  const t = await getTranslations("settings");
  const displayName = resolveAccountDisplayName(user.name, user.email);
  const initial = resolveAccountInitial(displayName);

  return (
    <div className="flex flex-col gap-8">
      <AccountPageHeader title={t("title")} description={t("description")} />

      <SettingsCard
        title={t("profile.title")}
        description={t("profile.description")}
      >
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="size-16 after:hidden" size="lg">
            <AvatarImage
              src={user.imageUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-secondary text-lg font-bold text-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight">
              {displayName}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <UpdateProfileForm name={user.name} email={user.email} />
      </SettingsCard>

      <SettingsCard
        title={t("password.title")}
        description={t("password.description")}
      >
        <ChangePasswordForm />
      </SettingsCard>

      <SettingsCard
        title={t("language.title")}
        description={t("language.description")}
      >
        <LocaleSwitcher className="w-full" />
      </SettingsCard>

      <SettingsCard
        title={t("session.title")}
        description={t("session.description")}
      >
        <SettingsSignOut />
      </SettingsCard>
    </div>
  );
}
