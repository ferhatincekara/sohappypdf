import { cn } from "@/lib/utils";

export function AdminMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background",
        className,
      )}
      aria-hidden
    >
      S
    </span>
  );
}
