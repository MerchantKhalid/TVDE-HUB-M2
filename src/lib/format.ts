export function formatEUR(locale: string, cents: number): string {
  return new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatDate(
  locale: string,
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    timeZone: "Europe/Lisbon",
    ...options,
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatNumber(locale: string, value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-GB", options).format(value);
}