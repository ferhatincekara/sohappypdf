import type { ReactNode } from "react";
import { BrandLogo } from "@/features/shell/brand-logo";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <BrandLogo title="SoHappyPDF" className="h-7 w-auto" />
          <p className="mt-2 text-xs text-muted-foreground">
            {eyebrow ?? "Operations"}
          </p>
        </div>
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <div className="mt-6">{children}</div>
        </section>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Internal administrators only.
        </p>
      </div>
    </main>
  );
}
