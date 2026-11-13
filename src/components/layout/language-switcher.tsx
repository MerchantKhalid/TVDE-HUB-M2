"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const flags: Record<Locale, string> = { pt: "🇵🇹", en: "🇬🇧" };

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    const search = typeof window !== "undefined" ? window.location.search : "";
    startTransition(() => {
      router.replace(`${pathname}${search}`, { locale: next });
    });
  }

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn("inline-flex rounded-xl border bg-card p-0.5", pending && "opacity-70", className)}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchTo(loc)}
          aria-pressed={loc === locale}
          aria-label={t(`languageName.${loc}`)}
          lang={loc}
          className={cn(
            "flex h-9 min-w-11 items-center justify-center gap-1 rounded-[10px] px-2 text-xs font-bold uppercase transition-colors",
            loc === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span aria-hidden="true">{flags[loc]}</span>
          {loc}
        </button>
      ))}
    </div>
  );
}