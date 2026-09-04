export function MetricCard({
  label,
  value,
  hint,
  unavailable,
}: {
  label: string;
  value: string;
  hint?: string;
  unavailable?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2.5">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight">
        {unavailable ? "Unavailable" : value}
      </p>
      {hint !== undefined ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
