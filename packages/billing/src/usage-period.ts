export type UsagePeriod = {
  start: Date;
  end: Date;
};

export function getUtcDayPeriod(now: Date): UsagePeriod {
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );

  return { start, end };
}

export function getUtcMonthPeriod(now: Date): UsagePeriod {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );

  return { start, end };
}

export function addUtcMonths(date: Date, months: number): Date {
  const totalMonths = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return new Date(
    Date.UTC(
      year,
      month,
      Math.min(day, lastDay),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

export function resolveAnchoredMonthPeriod(input: {
  anchorStart: Date;
  now: Date;
}): UsagePeriod {
  let start = input.anchorStart;
  let end = addUtcMonths(start, 1);

  if (input.now.getTime() < start.getTime()) {
    return { start, end };
  }

  while (end.getTime() <= input.now.getTime()) {
    start = end;
    end = addUtcMonths(start, 1);
  }

  return { start, end };
}
