import { cn } from "@/lib/utils";
import { billingTileClassName } from "./billing-plan-hero";

export function BillingStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={cn(billingTileClassName, "px-4 py-4 text-foreground")}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-extrabold tracking-tight text-foreground tabular-nums">
        {value}
      </dd>
    </div>
  );
}
