const KIBIBYTE = 1024;
const MEBIBYTE = 1024 * 1024;
const GIBIBYTE = 1024 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  const absolute = Math.max(0, bytes);

  if (absolute >= GIBIBYTE) {
    return `${trimTrailingZero(absolute / GIBIBYTE)} GB`;
  }

  if (absolute >= MEBIBYTE) {
    return `${trimTrailingZero(absolute / MEBIBYTE)} MB`;
  }

  if (absolute >= KIBIBYTE) {
    return `${trimTrailingZero(absolute / KIBIBYTE)} KB`;
  }

  return `${absolute} B`;
}

function trimTrailingZero(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatUploadProgress(loaded: number, total: number): string {
  if (total < 1) {
    return formatFileSize(loaded);
  }

  return `${formatFileSize(loaded)} / ${formatFileSize(total)}`;
}
