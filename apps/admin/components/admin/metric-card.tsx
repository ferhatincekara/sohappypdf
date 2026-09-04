import type { ReactNode } from "react";

export function MetricSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  );
}

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
    <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-xs">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight">
        {unavailable ? "Unavailable" : value}
      </p>
      {hint !== undefined ? (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
