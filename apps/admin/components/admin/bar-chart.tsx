export type BarChartItem = {
  key: string;
  label: string;
  value: number;
};

export function BarChart({ items }: { items: readonly BarChartItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No data in this range.
      </p>
    );
  }

  return (
    <div className="flex h-44 items-end gap-1.5 sm:gap-2">
      {items.map((item) => {
        const height =
          item.value === 0 ? 4 : Math.max((item.value / max) * 100, 8);

        return (
          <div
            key={item.key}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <div
              className="w-full rounded-t-md bg-primary"
              style={{ height: `${height}%` }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="w-full truncate text-center text-[10px] text-muted-foreground">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function RankedBars({ items }: { items: readonly BarChartItem[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No data in this range.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.key} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.label}</span>
            <span className="shrink-0 text-muted-foreground">{item.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((item.value / max) * 100, 3)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
