export function stemFromFilename(filename: string | null): string {
  if (filename === null || filename.trim().length === 0) {
    return "file";
  }

  const trimmed = filename.trim();
  const separator = trimmed.lastIndexOf(".");
  const stem = separator > 0 ? trimmed.slice(0, separator) : trimmed;
  const safe = stem.replace(/[/\\?%*:|"<>]/g, "-").trim();

  return safe.length === 0 ? "file" : safe.slice(0, 80);
}

export function bulkDownloadEntryName(input: {
  sourceFilename: string | null;
  targetFormat: string;
  index: number;
}): string {
  const stem = stemFromFilename(input.sourceFilename);
  const format = input.targetFormat.trim().toLowerCase() || "bin";
  const suffix = input.index === 0 ? "" : `-${input.index + 1}`;
  return `${stem}${suffix}.${format}`;
}
