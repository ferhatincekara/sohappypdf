export function ToolHeader({
  category,
  name,
  description,
  authenticationNotice,
}: {
  category: string;
  name: string;
  description: string;
  authenticationNotice: string | null;
}) {
  return (
    <header className="flex flex-col gap-3">
      <p className="text-sm font-medium text-muted-foreground">{category}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {name}
      </h1>
      <p className="max-w-2xl text-base text-muted-foreground text-pretty">
        {description}
      </p>
      {authenticationNotice === null ? null : (
        <p className="text-sm text-muted-foreground">{authenticationNotice}</p>
      )}
    </header>
  );
}
