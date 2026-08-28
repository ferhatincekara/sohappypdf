import { getMarketingToolIcon } from "@/features/marketing/lib/marketing-tool-icon";

export function ToolHeader({
  icon,
  category,
  name,
  description,
  authenticationNotice,
}: {
  icon: string;
  category: string;
  name: string;
  description: string;
  authenticationNotice: string | null;
}) {
  const Icon = getMarketingToolIcon(icon);

  return (
    <header>
      <p className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[13px] font-medium text-foreground/85">
        <Icon className="size-3.5 text-foreground/70" aria-hidden="true" />
        {category}
      </p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance md:text-4xl md:leading-tight">
        {name}
      </h1>
      <p className="mt-3 max-w-xl text-lg/7 text-muted-foreground text-pretty">
        {description}
      </p>
      {authenticationNotice === null ? null : (
        <p className="mt-3 text-sm text-muted-foreground">
          {authenticationNotice}
        </p>
      )}
    </header>
  );
}
