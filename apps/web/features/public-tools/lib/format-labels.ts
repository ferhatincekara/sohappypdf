const FORMAT_LABELS: Record<string, string> = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOCX",
  xls: "XLS",
  xlsx: "XLSX",
  ppt: "PPT",
  pptx: "PPTX",
  jpg: "JPG",
  jpeg: "JPG",
  png: "PNG",
  txt: "TXT",
  md: "Markdown",
};

export function formatLabel(format: string): string {
  return FORMAT_LABELS[format.toLowerCase()] ?? format.toUpperCase();
}

export function formatAcceptedFormats(
  formats: readonly string[],
  conjunction: string,
): string {
  const labels = formats.map((format) => formatLabel(format));

  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return labels[0] ?? "";
  }

  if (labels.length === 2) {
    return `${labels[0]} ${conjunction} ${labels[1]}`;
  }

  const head = labels.slice(0, -1).join(", ");
  const tail = labels[labels.length - 1];
  return `${head}, ${conjunction} ${tail}`;
}
