import { cn } from "@/lib/utils";

const barClassName =
  "absolute left-1 h-0.5 w-4 origin-center rounded-full bg-current transition-transform duration-300 ease-out-quart motion-reduce:transition-none";

export function MarketingMenuToggleIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block size-6" aria-hidden="true">
      <span
        className={cn(
          barClassName,
          "top-1.25",
          open ? "translate-y-1.5 rotate-45" : "translate-y-0 rotate-0",
        )}
      />
      <span
        className={cn(
          barClassName,
          "top-2.75 transition-opacity duration-200",
          open ? "opacity-0" : "opacity-100",
        )}
      />
      <span
        className={cn(
          barClassName,
          "top-4.25",
          open ? "-translate-y-1.5 -rotate-45" : "translate-y-0 rotate-0",
        )}
      />
    </span>
  );
}
