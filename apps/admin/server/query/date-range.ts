export type AdminDateRangePreset = "today" | "7d" | "30d" | "90d";

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function resolveDateRange(
  preset: string | undefined,
  now: Date = new Date(),
): { preset: AdminDateRangePreset; start: Date; end: Date } {
  const normalized =
    preset === "today" || preset === "7d" || preset === "90d" ? preset : "30d";
  const end = now;
  const start = startOfUtcDay(now);

  if (normalized === "today") {
    return { preset: normalized, start, end };
  }

  const days = normalized === "7d" ? 7 : normalized === "90d" ? 90 : 30;
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { preset: normalized, start, end };
}

export function parseOptionalDate(value: string | undefined): Date | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}
