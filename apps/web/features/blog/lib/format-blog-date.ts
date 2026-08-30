import { toDateLocale } from "@/lib/i18n/routing";

export function formatBlogDate(date: string, locale: string): string {
  const [year, month, day] = date.split("-").map(Number);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    throw new Error(`Invalid blog date: ${date}`);
  }

  return new Intl.DateTimeFormat(toDateLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
