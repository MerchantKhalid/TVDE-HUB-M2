import { routing, type Locale } from "@/i18n/routing";

export function normalizeLocale(value: string): Locale {
  return (routing.locales as readonly string[]).includes(value) ? (value as Locale) : routing.defaultLocale;
}
