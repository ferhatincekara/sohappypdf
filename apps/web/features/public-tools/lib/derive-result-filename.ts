export function deriveResultFilename(
  sourceFilename: string | null,
  targetFormat: string,
): string | null {
  if (sourceFilename === null) {
    return null;
  }

  const trimmed = sourceFilename.trim();
  if (trimmed.length === 0 || targetFormat.trim().length === 0) {
    return null;
  }

  const separator = trimmed.lastIndexOf(".");
  const base = separator > 0 ? trimmed.slice(0, separator) : trimmed;
  return `${base}.${targetFormat.trim()}`;
}
