import type { ReactNode } from "react";

export type ConversionActivityStatusTone = "neutral" | "ready" | "failed";

const statusToneClassName: Record<ConversionActivityStatusTone, string> = {
  ready:
    "inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground",
  failed:
    "inline-flex rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive",
  neutral:
    "inline-flex rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-foreground",
};

export function ConversionActivityRow({
  title,
  subtitle,
  detail,
  statusLabel,
  statusTone = "neutral",
  createdAt,
  createdLabel,
  expiresAt,
  expiresLabel,
  actions,
}: {
  title: string;
  subtitle: string;
  detail?: string | null;
  statusLabel: string;
  statusTone?: ConversionActivityStatusTone;
  createdAt: string;
  createdLabel: string;
  expiresAt?: string | null;
  expiresLabel?: string | null;
  actions: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-md bg-muted px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold tracking-tight text-foreground">
          {title}
        </p>
        <p className="mt-0.5 truncate text-sm text-foreground">{subtitle}</p>
        {detail === null ||
        detail === undefined ||
        detail.length === 0 ? null : (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {detail}
          </p>
        )}
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className={statusToneClassName[statusTone]}>{statusLabel}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={createdAt}>{createdLabel}</time>
          {expiresLabel === null ||
          expiresLabel === undefined ||
          expiresAt === null ||
          expiresAt === undefined ? null : (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={expiresAt}>{expiresLabel}</time>
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {actions}
      </div>
    </li>
  );
}
