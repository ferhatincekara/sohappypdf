import type { ReactNode } from "react";

export function ToolStage({
  main,
  sidebar,
}: {
  main: ReactNode;
  sidebar: ReactNode | null;
}) {
  if (sidebar === null) {
    return <div className="min-w-0">{main}</div>;
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_--spacing(88)] lg:gap-8">
      <div className="min-w-0">{main}</div>
      <aside className="self-start lg:sticky lg:top-24">{sidebar}</aside>
    </div>
  );
}
