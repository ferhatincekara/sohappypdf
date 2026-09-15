const ISO6391_TO_TESSERACT: Readonly<Record<string, string>> = {
  de: "deu",
  en: "eng",
  es: "spa",
  fr: "fra",
  tr: "tur",
};

export function toTesseractLanguage(language: string): string {
  return language
    .split("+")
    .map((part) => {
      const trimmed = part.trim();
      if (trimmed.length === 0) {
        return trimmed;
      }

      const base =
        trimmed.replaceAll("_", "-").split("-")[0]?.toLowerCase() ?? trimmed;
      return ISO6391_TO_TESSERACT[base] ?? trimmed;
    })
    .filter((part) => part.length > 0)
    .join("+");
}
