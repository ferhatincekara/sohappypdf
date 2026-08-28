import {
  type CompactAge,
  compactAgeFrom,
  compactRemainingFrom,
} from "./format-compact-age";

export function activityAgeFrom(
  createdAt: string,
  now: Date = new Date(),
): CompactAge {
  return compactAgeFrom(createdAt, now);
}

export function activityRemainingFrom(
  expiresAt: string | null,
  expired: boolean,
  now: Date = new Date(),
): CompactAge | null {
  if (expired || expiresAt === null) {
    return null;
  }

  return compactRemainingFrom(expiresAt, now);
}

export function activityAgeLabel(
  age: CompactAge,
  t: (key: string, values?: { count: number }) => string,
): string {
  if (age.unit === "justNow") {
    return t("justNow");
  }

  return t(age.unit, { count: age.count });
}

export function activityRemainingLabel(
  remaining: CompactAge | null,
  t: (key: string, values?: { count: number }) => string,
): string | null {
  if (remaining === null) {
    return null;
  }

  return t(remaining.unit, { count: remaining.count });
}
