export type UsagePeriod = {
  start: Date;
  end: Date;
};

export function getUtcMonthPeriod(now: Date): UsagePeriod {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );

  return { start, end };
}
