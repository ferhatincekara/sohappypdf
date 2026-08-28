import type { ReactNode } from "react";

export function AccountPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-xl flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg/7">
          {description}
        </p>
      </div>
      {action === undefined ? null : <div className="shrink-0">{action}</div>}
    </div>
  );
}
