import { billingTileClassName } from "@/features/billing/components/billing-plan-hero";
import { cn } from "@/lib/utils";

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
