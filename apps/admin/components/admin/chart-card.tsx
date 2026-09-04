import type { ReactNode } from "react";

export function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {description === undefined ? null : (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
