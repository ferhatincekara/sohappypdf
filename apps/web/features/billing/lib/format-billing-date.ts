export const BILLING_DISPLAY_DATE = {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
} as const;

export function formatBillingDisplayDate(
  value: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, BILLING_DISPLAY_DATE).format(
    new Date(value),
  );
}
