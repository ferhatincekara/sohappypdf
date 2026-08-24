"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/lib/i18n/navigation";
import type { MarketingToolNavGroup } from "../lib/marketing-tools";

export function MarketingToolsNav({
  groups,
}: {
  groups: readonly MarketingToolNavGroup[];
}) {
  const t = useTranslations("marketing.nav");
  const tTypes = useTranslations("conversions.form.types");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          />
        }
      >
        {t("tools")}
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {groups.map((group, index) => (
          <DropdownMenuGroup key={group.category}>
            {index === 0 ? null : <DropdownMenuSeparator />}
            <DropdownMenuLabel>
              {t(`categories.${group.category}`)}
            </DropdownMenuLabel>
            {group.tools.map((tool) => (
              <DropdownMenuItem
                key={tool.id}
                render={<Link href={tool.href} />}
              >
                {tTypes(tool.id)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
