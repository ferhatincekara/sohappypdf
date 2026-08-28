"use client";

import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
import { MARKETING_PATHS } from "../lib/marketing-paths";
import type { MarketingToolNavGroup } from "../lib/marketing-tools";

export function MarketingToolsNav({
  groups,
}: {
  groups: readonly MarketingToolNavGroup[];
}) {
  const t = useTranslations("marketing.nav");
  const tTools = useTranslations("tools");

  return (
    <DropdownMenu>
      <Button variant="ghost" size="sm" render={<DropdownMenuTrigger />}>
        {t("tools")}
        <ChevronDownIcon className="size-4" />
      </Button>
      <DropdownMenuContent
        align="start"
        className="w-[min(90vw,44rem)] max-h-[min(70vh,36rem)] p-2"
      >
        <DropdownMenuItem
          className="font-medium"
          render={<Link href={MARKETING_PATHS.tools} />}
        >
          {t("allTools")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
          {groups.map((group) => (
            <DropdownMenuGroup
              key={group.category}
              className="flex min-w-0 flex-col"
            >
              <DropdownMenuLabel className="px-2">
                {t(`categories.${group.category}`)}
              </DropdownMenuLabel>
              {group.tools.map((tool) => (
                <DropdownMenuItem
                  key={tool.id}
                  className="whitespace-normal"
                  render={<Link href={tool.href} />}
                >
                  {tTools(`${tool.id}.name`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
