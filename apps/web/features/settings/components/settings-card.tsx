import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-7 bg-muted p-6 shadow-none md:p-7">
      <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
      {description === undefined ? null : (
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </Card>
  );
}
