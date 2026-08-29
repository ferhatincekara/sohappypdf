"use client";

import { ChevronDownIcon, LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_NAVIGATION } from "@/features/app-shell/config/navigation";
import {
  resolveAccountDisplayName,
  resolveAccountInitial,
} from "@/features/app-shell/lib/account-display-name";
import type { AppShellUser } from "@/features/app-shell/types";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { Link } from "@/lib/i18n/navigation";

export function UserMenu({
  user,
  align = "end",
}: {
  user: AppShellUser;
  align?: "start" | "end";
}) {
  const t = useTranslations("appShell");
  const { logout, isPending } = useLogout();
  const displayName = resolveAccountDisplayName(user.name, user.email);
  const initial = resolveAccountInitial(displayName);

  return (
    <DropdownMenu>
      <Button
        variant="secondary"
        size="sm"
        render={<DropdownMenuTrigger />}
        aria-label={t("userMenu")}
      >
        {t("navigation")}
        <ChevronDownIcon className="size-4 opacity-70 transition-transform duration-300 ease-out-quart group-data-popup-open/button:rotate-180" />
      </Button>
      <DropdownMenuContent align={align} sideOffset={10} className="min-w-60">
        <div className="mb-1 flex items-center gap-2.5 rounded-2xl bg-muted px-2 py-2">
          <Avatar className="size-9 after:hidden">
            <AvatarImage
              src={user.imageUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-secondary text-[13px] font-bold tracking-tight text-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold tracking-tight">
              {displayName}
            </span>
            <span
              className="block truncate text-[13px] font-medium text-muted-foreground"
              title={user.email}
            >
              {user.email}
            </span>
          </span>
        </div>
        <DropdownMenuGroup>
          {APP_NAVIGATION.map((item) => {
            const Icon = item.icon;

            return (
              <DropdownMenuItem
                key={item.id}
                render={<Link href={item.href} />}
              >
                <Icon />
                {t(`nav.${item.id}`)}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
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
  );
}
