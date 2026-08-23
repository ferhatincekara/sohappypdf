/**
 * lastUsedAt is approximate telemetry, not an auth signal.
 * Update at most once per interval so authentication does not write
 * on every request. A failed update must not fail authentication.
 */
export const API_KEY_LAST_USED_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

export function shouldUpdateLastUsedAt(
  lastUsedAt: Date | null,
  now: Date,
  intervalMs = API_KEY_LAST_USED_UPDATE_INTERVAL_MS,
): boolean {
  if (lastUsedAt === null) {
    return true;
  }

  return now.getTime() - lastUsedAt.getTime() >= intervalMs;
}
