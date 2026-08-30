import { type AppLocale, routing } from "@/lib/i18n/routing";

type LanguageCandidate = {
  tag: string;
  quality: number;
  index: number;
};

function parseAcceptLanguage(header: string): LanguageCandidate[] {
  return header
    .split(",")
    .map((part, index) => {
      const [range, ...params] = part.trim().split(";");
      const tag = range?.trim().toLowerCase() ?? "";
      const qualityParam = params.find((param) =>
        param.trim().startsWith("q="),
      );
      const quality = qualityParam
        ? Number.parseFloat(qualityParam.trim().slice(2))
        : 1;

      return {
        tag,
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .filter((candidate) => candidate.tag !== "" && candidate.quality > 0)
    .sort((left, right) => {
      if (right.quality !== left.quality) {
        return right.quality - left.quality;
      }

      return left.index - right.index;
    });
}

function findCanonicalLocale(tag: string): AppLocale | undefined {
  const normalized = tag.trim().toLowerCase();

  if (normalized === "") {
    return undefined;
  }

  const exact = routing.locales.find(
    (locale) => locale.toLowerCase() === normalized,
  );

  if (exact !== undefined) {
    return exact;
  }

  const language = normalized.split("-")[0];

  if (language === undefined || language === "") {
    return undefined;
  }

  return routing.locales.find((locale) => {
    const localeLower = locale.toLowerCase();
    return localeLower === language || localeLower.startsWith(`${language}-`);
  });
}

export function parseAppLocale(
  value: string | null | undefined,
): AppLocale | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return findCanonicalLocale(value);
}

export function resolveAppLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): AppLocale {
  const fromCookie = parseAppLocale(input.cookieLocale);

  if (fromCookie !== undefined) {
    return fromCookie;
  }

  return resolveLocaleFromAcceptLanguage(input.acceptLanguage);
}

export function resolveLocaleFromAcceptLanguage(
  header: string | null | undefined,
): AppLocale {
  if (header === undefined || header === null || header.trim() === "") {
    return routing.defaultLocale;
  }

  for (const candidate of parseAcceptLanguage(header)) {
    const matched = findCanonicalLocale(candidate.tag);

    if (matched !== undefined) {
      return matched;
    }
  }

  return routing.defaultLocale;
}
