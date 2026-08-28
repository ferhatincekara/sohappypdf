import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MarketingPageHeader({
  eyebrow,
  title,
  description,
  titleAs = "h1",
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  description: string;
  titleAs?: "h1" | "h2";
  className?: string;
}) {
  const Title = titleAs;

  return (
    <header className={cn("max-w-2xl", className)}>
      {eyebrow === undefined ? null : (
        <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </div>
      )}
      <Title
        className={cn(
          "text-3xl font-extrabold tracking-tight text-balance md:text-5xl md:leading-tight",
          eyebrow === undefined ? null : "mt-3",
        )}
      >
        {title}
      </Title>
      <p className="mt-4 text-lg/7 text-muted-foreground text-pretty">
        {description}
      </p>
    </header>
  );
}
