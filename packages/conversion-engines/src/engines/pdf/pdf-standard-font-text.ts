import type { PDFFont } from "pdf-lib";

const REPLACEMENTS: Readonly<Record<string, string>> = {
  "\u00a0": " ",
  "\u2018": "'",
  "\u2019": "'",
  "\u201a": ",",
  "\u201c": '"',
  "\u201d": '"',
  "\u201e": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2022": "-",
  "\u2026": "...",
  "\u2032": "'",
  "\u2033": '"',
  "\u2212": "-",
  "\u00ad": "",
  "\u011f": "g",
  "\u011e": "G",
  "\u0131": "i",
  "\u0130": "I",
  "\u015f": "s",
  "\u015e": "S",
};

function canEncode(font: PDFFont, text: string): boolean {
  try {
    font.encodeText(text);
    return true;
  } catch {
    return false;
  }
}

export function toStandardFontText(font: PDFFont, text: string): string {
  const normalized = text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length === 0) {
    return "";
  }

  if (canEncode(font, normalized)) {
    return normalized;
  }

  let encoded = "";

  for (const char of normalized) {
    const mapped = REPLACEMENTS[char] ?? char;

    if (mapped.length === 0) {
      continue;
    }

    if (canEncode(font, mapped)) {
      encoded += mapped;
      continue;
    }

    encoded += "?";
  }

  return encoded.trim();
}
