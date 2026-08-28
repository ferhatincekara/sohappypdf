import { ArrowRightIcon, LockIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  hero: "h-90 sm:h-110 md:h-130",
  spotlight: "h-85 md:h-105",
  story: "h-35",
} as const;

export type MarketingSceneKind = "convert" | "compress" | "protect";
type MarketingSceneSize = keyof typeof SIZE_CLASS;

export function MarketingScene({
  size,
  kind,
  label,
  children,
  className,
}: {
  size: MarketingSceneSize;
  kind: MarketingSceneKind;
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "relative m-0 w-full isolate overflow-visible",
        SIZE_CLASS[size],
        className,
      )}
    >
      {size === "story" ? null : <SceneGlow />}
      {kind === "convert" ? <ConvertArt size={size} /> : null}
      {kind === "compress" ? <CompressArt size={size} /> : null}
      {kind === "protect" ? <ProtectArt size={size} /> : null}
      {children}
      {label === undefined ? null : (
        <figcaption className="sr-only">{label}</figcaption>
      )}
    </figure>
  );
}

function SceneGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute right-[8%] top-[8%] size-40 rounded-full bg-primary/35 blur-3xl md:size-56" />
      <div className="absolute bottom-[12%] left-[18%] size-36 rounded-full bg-secondary/30 blur-3xl md:size-48" />
    </div>
  );
}

function ConvertArt({ size }: { size: MarketingSceneSize }) {
  const compact = size === "story";
  const hero = size === "hero";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 flex",
        compact
          ? "items-start justify-center pt-4"
          : "items-center justify-center",
      )}
    >
      <div
        className={cn(
          "relative",
          compact
            ? "h-18 w-40"
            : hero
              ? "h-64 w-104 md:h-88 md:w-136"
              : "h-56 w-96 md:h-72 md:w-120",
        )}
      >
        {compact ? null : (
          <>
            <GhostSheet className="left-2 top-12 h-44 w-32 -rotate-22 md:h-56 md:w-40" />
            <GhostSheet
              className="left-8 top-6 h-48 w-36 -rotate-12 opacity-90 md:h-60 md:w-44"
              filled
            />
          </>
        )}

        <DocumentSheet
          fold
          className={cn(
            "absolute -rotate-7 bg-white",
            compact
              ? "left-0 top-2 h-17 w-19 rounded-3.5 p-1.5"
              : hero
                ? "left-10 top-8 h-52 w-40 rounded-5.5 p-4 md:h-64 md:w-48 md:p-5"
                : "left-8 top-6 h-48 w-36 rounded-md p-4 md:h-56 md:w-44",
          )}
          stamp="PDF"
          stampClassName="bg-foreground text-background"
        >
          <Line className={compact ? "w-8" : "w-14"} />
          <Paragraph compact={compact} />
        </DocumentSheet>

        <Stamp
          className={cn(
            compact
              ? "left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2"
              : hero
                ? "left-1/2 top-[46%] size-14 -translate-x-1/2 -translate-y-1/2"
                : "left-1/2 top-[48%] size-12 -translate-x-1/2 -translate-y-1/2",
          )}
        >
          <ArrowRightIcon
            className={compact ? "size-3.5" : hero ? "size-6" : "size-5"}
          />
        </Stamp>

        <DocumentSheet
          fold
          className={cn(
            "absolute rotate-8 bg-white shadow-lift",
            compact
              ? "right-0 top-0 h-17 w-19 rounded-3.5 p-1.5"
              : hero
                ? "right-0 top-0 h-52 w-40 rounded-5.5 p-4 md:h-64 md:w-48 md:p-5"
                : "right-2 top-0 h-48 w-36 rounded-md p-4 md:h-56 md:w-44",
          )}
          stamp="DOCX"
          stampClassName="bg-secondary text-foreground"
        >
          <Line className={compact ? "w-9" : "w-16"} />
          <Paragraph compact={compact} />
        </DocumentSheet>
      </div>
    </div>
  );
}

function CompressArt({ size }: { size: MarketingSceneSize }) {
  const compact = size === "story";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 flex",
        compact
          ? "items-start justify-center pt-3"
          : "items-center justify-center",
      )}
    >
      <div
        className={cn(
          "relative",
          compact ? "h-19 w-44" : "h-64 w-96 md:h-80 md:w-120",
        )}
      >
        {compact ? null : (
          <>
            <GhostSheet className="left-0 top-14 h-48 w-36 -rotate-20 md:h-60 md:w-44" />
            <GhostSheet
              className="left-7 top-8 h-52 w-40 -rotate-10 md:h-64 md:w-48"
              filled
            />
          </>
        )}

        <DocumentSheet
          fold
          className={cn(
            "absolute -rotate-5 bg-white",
            compact
              ? "left-0 top-2 h-17 w-19 rounded-3.5 p-1.5"
              : "left-12 top-6 h-52 w-40 rounded-5.5 p-4 md:left-14 md:h-64 md:w-48 md:p-5",
          )}
        >
          {compact ? null : <AccentRule />}
          <Line className={compact ? "w-8" : "w-14"} />
          <Paragraph compact={compact} />
        </DocumentSheet>

        <Stamp
          className={cn(
            compact
              ? "left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2"
              : "left-[54%] top-[44%] size-12 -translate-x-1/2 -translate-y-1/2 md:size-14",
          )}
        >
          <ArrowRightIcon className={compact ? "size-3.5" : "size-5"} />
        </Stamp>

        <DocumentSheet
          className={cn(
            "absolute rotate-9 border-2 border-primary bg-white shadow-lift",
            compact
              ? "right-0 top-0 h-11 w-10 rounded-3 p-1"
              : "right-1 top-2 h-36 w-24 rounded-4.5 p-3 md:h-44 md:w-28 md:p-3.5",
          )}
        >
          <Line className={compact ? "w-6" : "w-10"} />
          <Line className="w-full" muted />
          <Line className="w-3/4" muted />
          {compact ? null : (
            <div className="mt-auto h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[26%] rounded-full bg-primary" />
            </div>
          )}
        </DocumentSheet>
      </div>
    </div>
  );
}

function ProtectArt({ size }: { size: MarketingSceneSize }) {
  const compact = size === "story";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 flex",
        compact
          ? "items-start justify-center pt-3"
          : "items-center justify-center",
      )}
    >
      <div className="relative">
        {compact ? null : (
          <>
            <GhostSheet className="-left-16 top-14 h-52 w-40 -rotate-18 md:h-60 md:w-48" />
            <GhostSheet
              className="-left-8 top-7 h-56 w-44 -rotate-9 md:h-64 md:w-52"
              filled
            />
          </>
        )}

        <DocumentSheet
          fold
          className={cn(
            "relative bg-white shadow-lift",
            compact
              ? "h-21 w-30 rounded-3.5 p-2"
              : "h-56 w-48 rounded-lg p-5 md:h-72 md:w-56 md:p-6",
          )}
        >
          {compact ? <Line className="w-10" /> : <AccentRule />}
          <Paragraph compact={compact} />
          <div
            className={cn(
              "mt-auto flex items-center rounded-full bg-muted",
              compact ? "h-4 gap-1 px-1.5" : "h-10 gap-2 px-3",
            )}
          >
            <span
              className={cn(
                "rounded-full bg-foreground/20",
                compact ? "size-1.5" : "size-2.5",
              )}
            />
            <span
              className={cn(
                "rounded-full bg-foreground/20",
                compact ? "size-1.5" : "size-2.5",
              )}
            />
            <span
              className={cn(
                "rounded-full bg-foreground/20",
                compact ? "size-1.5" : "size-2.5",
              )}
            />
            <span
              className={cn(
                "rounded-full bg-foreground/20",
                compact ? "size-1.5" : "size-2.5",
              )}
            />
          </div>
        </DocumentSheet>

        <Stamp
          className={cn(
            compact
              ? "-right-2 -top-2 size-8"
              : "-right-5 -top-5 size-17 md:-right-6 md:-top-6 md:size-19",
          )}
        >
          <LockIcon className={compact ? "size-3.5" : "size-7"} />
        </Stamp>
      </div>
    </div>
  );
}

function DocumentSheet({
  className,
  stamp,
  stampClassName,
  fold = false,
  children,
}: {
  className?: string;
  stamp?: string;
  stampClassName?: string;
  fold?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden border border-border/80 shadow-soft",
        className,
      )}
    >
      {fold ? <FoldCorner /> : null}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">{children}</div>
      {stamp === undefined ? null : (
        <span
          className={cn(
            "mt-auto w-fit rounded-md px-1.5 py-0.5 font-extrabold tracking-wide",
            stamp.length > 3
              ? "text-[9px] md:text-[11px]"
              : "text-[10px] md:text-xs",
            stampClassName,
          )}
        >
          {stamp}
        </span>
      )}
    </div>
  );
}

function GhostSheet({
  className,
  filled = false,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute rounded-5.5 border border-border",
        filled ? "bg-white" : "bg-white/60",
        className,
      )}
    />
  );
}

function FoldCorner() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 size-7 bg-[linear-gradient(135deg,transparent_50%,var(--muted)_50%)] md:size-8"
    />
  );
}

function AccentRule() {
  return <div className="h-1.5 w-12 rounded-full bg-primary md:h-2 md:w-16" />;
}

function Paragraph({ compact }: { compact: boolean }) {
  return (
    <>
      <Line className="w-full" muted />
      <Line className="w-5/6" muted />
      {compact ? (
        <Line className="w-2/3" muted />
      ) : (
        <>
          <Line className="w-2/3" muted />
          <div className="h-2" />
          <Line className="w-full" muted />
          <Line className="w-4/5" muted />
          <Line className="w-1/2" muted />
        </>
      )}
    </>
  );
}

function Stamp({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "absolute z-10 flex items-center justify-center rounded-full bg-primary text-foreground shadow-lift",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Line({
  className,
  muted = false,
}: {
  className?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "h-1 rounded-full md:h-1.5",
        muted ? "bg-foreground/12" : "bg-primary",
        className,
      )}
    />
  );
}
