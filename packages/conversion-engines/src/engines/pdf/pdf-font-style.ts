const SUBSET_PREFIX = /^[A-Z]{6}\+/;

const FAMILY_ALIASES: ReadonlyArray<readonly [RegExp, string]> = [
  [/timesnewroman|times/, "Times New Roman"],
  [/arial|helvetica|swiss/, "Arial"],
  [/courier/, "Courier New"],
  [/calibri/, "Calibri"],
  [/cambria/, "Cambria"],
  [/georgia/, "Georgia"],
  [/verdana/, "Verdana"],
  [/tahoma/, "Tahoma"],
  [/trebuchet/, "Trebuchet MS"],
  [/garamond/, "Garamond"],
  [/palatino/, "Palatino Linotype"],
  [/garuda|dejavusans/, "DejaVu Sans"],
  [/dejavuserif/, "DejaVu Serif"],
  [/liberationSans|nimbusSans/, "Arial"],
  [/liberationSerif|nimbusRoman/, "Times New Roman"],
  [/liberationMono|nimbusMono/, "Courier New"],
];

export type ResolvedPdfFont = {
  fontFamily: string;
  bold: boolean;
  italic: boolean;
};

function stripStyleSuffixes(name: string): string {
  return name
    .replace(SUBSET_PREFIX, "")
    .replace(/[-,]?(PSMT|PS|MT)$/g, "")
    .replace(
      /[-,]?(Bold|Italic|Oblique|Black|Heavy|Light|Thin|Regular|Medium|SemiBold|DemiBold|ExtraBold)+/gi,
      "",
    )
    .replace(/[-_]+$/g, "")
    .trim();
}

function aliasFamily(name: string): string {
  const compact = name.replace(/[\s_-]+/g, "").toLowerCase();

  for (const [pattern, family] of FAMILY_ALIASES) {
    if (pattern.test(compact)) {
      return family;
    }
  }

  const cleaned = stripStyleSuffixes(name).replace(/[_-]+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : "Arial";
}

export function resolvePdfFont(family: string): ResolvedPdfFont {
  const raw = family.replace(SUBSET_PREFIX, "");
  const lower = raw.toLowerCase();

  return {
    fontFamily: aliasFamily(raw),
    bold: /bold|black|heavy|semibold|demibold|extrabold/.test(lower),
    italic: /italic|oblique|slanted/.test(lower),
  };
}

export function sanitizeCssColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : "#000000";
}

export function clampFontSizePt(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 11;
  }

  return Math.min(96, Math.max(6, Math.round(value * 10) / 10));
}
