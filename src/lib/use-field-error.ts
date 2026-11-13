"use client";

import { useTranslations } from "next-intl";

/** Translates a Zod message key (e.g. "invalidEmail") using the "validation" namespace. */
export function useFieldError() {
  const t = useTranslations("validation");
  return (message?: string): string | undefined => {
    if (!message) return undefined;
    return t.has(message) ? t(message) : t("invalid");
  };
}
