import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "tr", "de", "es", "fr", "ja", "pt-BR"],
  defaultLocale: "en",
  localePrefix: "never",
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const LOCALE_DATE_TAGS = {
  en: "en-GB",
  tr: "tr-TR",
  de: "de-DE",
  es: "es-ES",
  fr: "fr-FR",
  ja: "ja-JP",
  "pt-BR": "pt-BR",
} as const satisfies Record<AppLocale, string>;

export const OPEN_GRAPH_LOCALES = {
  en: "en_US",
  tr: "tr_TR",
  de: "de_DE",
  es: "es_ES",
  fr: "fr_FR",
  ja: "ja_JP",
  "pt-BR": "pt_BR",
} as const satisfies Record<AppLocale, string>;

export function toDateLocale(locale: string): string {
  if (locale in LOCALE_DATE_TAGS) {
    return LOCALE_DATE_TAGS[locale as AppLocale];
  }

  return LOCALE_DATE_TAGS[routing.defaultLocale];
}

export function toOpenGraphLocale(locale: string): string {
  if (locale in OPEN_GRAPH_LOCALES) {
    return OPEN_GRAPH_LOCALES[locale as AppLocale];
  }

  return OPEN_GRAPH_LOCALES[routing.defaultLocale];
}
