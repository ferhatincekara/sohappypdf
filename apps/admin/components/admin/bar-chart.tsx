export type BarChartItem = {
  key: string;
  label: string;
  value: number;
};

function chartValue(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function BarChart({ items }: { items: readonly BarChartItem[] }) {
  const values = items.map((item) => chartValue(item.value));
  const max = Math.max(...values, 1);

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No data in this range.
      </p>
    );
  }

  return (
    <div className="flex h-48 gap-1.5 sm:gap-2">
      {items.map((item, index) => {
        const value = values[index] ?? 0;
        const percent = value === 0 ? 0 : Math.max((value / max) * 100, 6);

        return (
          <div
            key={item.key}
            className="flex min-w-0 flex-1 flex-col"
            title={`${item.label}: ${value}`}
          >
            <div className="flex min-h-0 flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-foreground"
                style={{ height: `${percent}%` }}
              />
            </div>
            <span className="mt-1.5 truncate text-center text-[10px] text-muted-foreground">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function RankedBars({ items }: { items: readonly BarChartItem[] }) {
  const values = items.map((item) => chartValue(item.value));
  const max = Math.max(...values, 1);

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No data in this range.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const value = values[index] ?? 0;

        return (
          <li key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{item.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {value}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{
                  width: `${Math.max((value / max) * 100, value === 0 ? 0 : 4)}%`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
