export const POLAR_CHECKOUT_LOCALES = [
  "en",
  "nl",
  "es",
  "fr",
  "sv",
  "de",
  "hu",
  "it",
  "pt",
  "pt-PT",
  "ko",
  "ja",
  "tr",
  "pl",
] as const;

export type PolarCheckoutLocale = (typeof POLAR_CHECKOUT_LOCALES)[number];

function isPolarCheckoutLocale(value: string): value is PolarCheckoutLocale {
  return POLAR_CHECKOUT_LOCALES.some((locale) => locale === value);
}

export function resolvePolarCheckoutLocale(
  value: string | undefined,
): PolarCheckoutLocale | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    return undefined;
  }

  if (isPolarCheckoutLocale(normalized)) {
    return normalized;
  }

  const language = normalized.split("-")[0]?.toLowerCase();

  if (language === undefined) {
    return undefined;
  }

  if (language === "pt") {
    return normalized.toLowerCase() === "pt-pt" ? "pt-PT" : "pt";
  }

  return isPolarCheckoutLocale(language) ? language : undefined;
}

export function withPolarCheckoutLocale(
  url: string,
  locale: PolarCheckoutLocale,
): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("locale", locale);
    return parsed.toString();
  } catch {
    return url;
  }
}
