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

export function bulkDownloadArchiveName(input: {
  toolId: string;
  count: number;
}): string {
  const tool = input.toolId.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const prefix = tool.length === 0 ? "sohappypdf" : tool;
  return `${prefix}-${input.count}-files.zip`;
}
