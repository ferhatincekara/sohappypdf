import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ToolSidebarCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn("rounded-7 bg-muted p-5 shadow-none md:p-7", className)}
    >
      {children}
    </Card>
  );
}
