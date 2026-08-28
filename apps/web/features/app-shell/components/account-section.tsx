import type { ReactNode } from "react";

export function AccountSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold tracking-tight">{title}</h2>
        {description === undefined ? null : (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
