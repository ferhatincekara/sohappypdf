import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MarketingContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-site px-5 md:px-8", className)}>
      {children}
    </div>
  );
}
