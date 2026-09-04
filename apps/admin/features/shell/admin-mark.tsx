import { cn } from "@/lib/utils";

export function AdminMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      S
    </span>
  );
}
