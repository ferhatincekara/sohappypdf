import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { getMarketingToolIcon } from "../lib/marketing-tool-icon";
import type { MarketingToolNavItem } from "../lib/marketing-tools";
import { MarketingToolStatusBadges } from "./marketing-tool-status-badges";

export function MarketingToolCard({
  tool,
  name,
  description,
  soonLabel,
  proLabel,
  titleAs = "h3",
}: {
  tool: MarketingToolNavItem;
  name: string;
  description: string;
  soonLabel: string;
  proLabel: string;
  titleAs?: "h2" | "h3";
}) {
  const Icon = getMarketingToolIcon(tool.icon);
  const isAvailable = tool.availability !== "planned";
  const Title = titleAs;
  const inner = (
    <>
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary",
          isAvailable ? null : "opacity-60",
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <Title className="line-clamp-2 min-h-10 text-sm font-bold leading-snug">
          {name}
        </Title>
        <p className="mt-1 hidden min-h-8 text-xs leading-relaxed text-muted-foreground sm:line-clamp-2 sm:block">
          {description}
        </p>
      </div>
      <MarketingToolStatusBadges
        availability={tool.availability}
        premium={tool.premium}
        soonLabel={soonLabel}
        proLabel={proLabel}
        className="mt-auto pt-3"
      />
    </>
  );

  return (
    <li className="flex">
      {isAvailable ? (
        <Link
          href={tool.href}
          className="flex min-h-full w-full flex-col rounded-3xl bg-muted p-5 transition-colors hover:bg-white hover:shadow-lift"
        >
          {inner}
        </Link>
      ) : (
        <div className="flex min-h-full w-full flex-col rounded-3xl bg-muted p-5 opacity-70">
          {inner}
        </div>
      )}
    </li>
  );
}
