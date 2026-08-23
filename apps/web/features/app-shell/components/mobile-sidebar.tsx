"use client";

import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/lib/i18n/navigation";
import { APP_PATHS } from "../config/app-paths";
import type { AppShellUser } from "../types";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarNavigation } from "./sidebar-navigation";

export function MobileSidebar({ user }: { user: AppShellUser }) {
  const t = useTranslations("appShell");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon-sm" className="md:hidden" />}
        aria-label={t("openNavigation")}
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent
        side="left"
        closeLabel={t("closeNavigation")}
        className="p-0"
      >
        <SheetHeader className="h-14 justify-center border-b border-border">
          <SheetTitle>
            <Link
              href={APP_PATHS.overview}
              onClick={() => {
                setOpen(false);
              }}
            >
              {t("brand")}
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col py-4">
          <SidebarNavigation
            onNavigate={() => {
              setOpen(false);
            }}
          />
          <SidebarFooter user={user} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
