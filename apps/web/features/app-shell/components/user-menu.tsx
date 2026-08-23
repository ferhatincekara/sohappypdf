"use client";

import { LogOutIcon, SettingsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useRouter } from "@/lib/i18n/navigation";
import { APP_PATHS } from "../config/app-paths";
import { getUserInitials } from "../lib/user-initials";
import type { AppShellUser } from "../types";

export function UserMenu({
  user,
  align = "end",
  compact = false,
}: {
  user: AppShellUser;
  align?: "start" | "end";
  compact?: boolean;
}) {
  const t = useTranslations("appShell");
  const router = useRouter();
  const { logout, isPending, error } = useLogout();
  const initials = getUserInitials(user.name, user.email);

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size={compact ? "icon-sm" : "default"}
              className={
                compact
                  ? undefined
                  : "h-auto w-full justify-start gap-2 px-2 py-1.5"
              }
            />
          }
          aria-label={t("userMenu")}
        >
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {compact ? null : (
            <span className="min-w-0 flex-1 truncate text-left text-sm">
              {user.email}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-56">
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              router.push(APP_PATHS.settings);
            }}
          >
            <SettingsIcon />
            {t("nav.settings")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              void logout();
            }}
          >
            <LogOutIcon />
            {isPending ? t("loggingOut") : t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error !== null ? (
        <p className="px-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
