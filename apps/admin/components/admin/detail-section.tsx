import type { ReactNode } from "react";

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-border bg-card">
      <h2 className="border-b border-border px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="px-3 py-3">{children}</div>
    </section>
  );
}

export function DetailGrid({
  items,
}: {
  items: ReadonlyArray<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {item.label}
          </dt>
          <dd className="mt-0.5 break-all text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
