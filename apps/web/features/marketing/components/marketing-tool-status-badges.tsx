import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MarketingToolNavItem } from "../lib/marketing-tools";

export function MarketingToolStatusBadges({
  availability,
  premium,
  soonLabel,
  proLabel,
  className,
}: {
  availability: MarketingToolNavItem["availability"];
  premium: boolean;
  soonLabel: string;
  proLabel: string;
  className?: string;
}) {
  const isPlanned = availability === "planned";

  if (isPlanned) {
    return (
      <span className={cn("flex shrink-0 items-center gap-1.5", className)}>
        <Badge variant="muted" size="sm">
          {soonLabel}
        </Badge>
      </span>
    );
  }

  if (!premium) {
    return null;
  }

  return (
    <span className={cn("flex shrink-0 items-center gap-1.5", className)}>
      <Badge variant="secondary" size="sm">
        {proLabel}
      </Badge>
    </span>
  );
}
