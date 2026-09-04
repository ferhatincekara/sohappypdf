import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  leading,
  actions,
}: {
  title: string;
  description?: string;
  leading?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {leading}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-[1.35rem]">
            {title}
          </h1>
          {description !== undefined ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions === undefined ? null : (
        <div className="flex flex-wrap gap-2">{actions}</div>
      )}
    </div>
  );
}
