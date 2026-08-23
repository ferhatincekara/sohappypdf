const KIB = 1024;
const MIB = 1024 * KIB;
const GIB = 1024 * MIB;

export function formatBytes(bytes: number): string {
  if (bytes >= GIB) {
    return `${trimNumber(bytes / GIB)} GB`;
  }

  if (bytes >= MIB) {
    return `${trimNumber(bytes / MIB)} MB`;
  }

  if (bytes >= KIB) {
    return `${trimNumber(bytes / KIB)} KB`;
  }

  return `${bytes} B`;
}

function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
