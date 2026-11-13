"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const order = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme ?? "system") : "system";
  const next = order[(order.indexOf(current as (typeof order)[number]) + 1) % order.length]!;
  const labels = { light: t("themeLight"), dark: t("themeDark"), system: t("themeSystem") };
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`${t("theme")}: ${labels[current as keyof typeof labels]}`}
      title={labels[current as keyof typeof labels]}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </Button>
  );
}