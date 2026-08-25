export type CompactAgeUnit = "justNow" | "minutes" | "hours";

export type CompactAge = {
  unit: CompactAgeUnit;
  count: number;
};

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

export function compactAgeFrom(
  createdAt: string,
  now: Date = new Date(),
): CompactAge {
  const elapsedMs = Math.max(0, now.getTime() - new Date(createdAt).getTime());

  if (elapsedMs < MINUTE_MS) {
    return { unit: "justNow", count: 0 };
  }

  if (elapsedMs < HOUR_MS) {
    return {
      unit: "minutes",
      count: Math.floor(elapsedMs / MINUTE_MS),
    };
  }

  return {
    unit: "hours",
    count: Math.max(1, Math.floor(elapsedMs / HOUR_MS)),
  };
}

export function compactRemainingFrom(
  expiresAt: string,
  now: Date = new Date(),
): CompactAge | null {
  const remainingMs = new Date(expiresAt).getTime() - now.getTime();

  if (remainingMs <= 0) {
    return null;
  }

  if (remainingMs < HOUR_MS) {
    return {
      unit: "minutes",
      count: Math.max(1, Math.floor(remainingMs / MINUTE_MS)),
    };
  }

  return {
    unit: "hours",
    count: Math.floor(remainingMs / HOUR_MS),
  };
}
