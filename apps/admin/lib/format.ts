const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const DATE_ONLY = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const NUMBER = new Intl.NumberFormat("en-US");

export function formatDateTime(
  value: Date | string | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return DATE_TIME.format(typeof value === "string" ? new Date(value) : value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return DATE_ONLY.format(typeof value === "string" ? new Date(value) : value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return NUMBER.format(value);
}

export function formatBytes(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDurationMs(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }

  const seconds = value / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

export function maskApiKeyPrefix(keyPrefix: string): string {
  if (keyPrefix.length <= 8) {
    return `${keyPrefix}••••`;
  }

  return `${keyPrefix.slice(0, 10)}••••${keyPrefix.slice(-4)}`;
}

export function shortId(id: string): string {
  return id.length <= 12 ? id : `${id.slice(0, 8)}…${id.slice(-4)}`;
}
