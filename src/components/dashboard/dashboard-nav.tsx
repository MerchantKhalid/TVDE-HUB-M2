"use client";

import { FileCheck2, LayoutDashboard, UserRound, CarFront, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; key: "overview" | "profile" | "vehicles" | "documents"; icon: LucideIcon };

const items: Item[] = [
  { href: "/dashboard", key: "overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", key: "profile", icon: UserRound },
  { href: "/dashboard/vehicles", key: "vehicles", icon: CarFront },
  { href: "/dashboard/documents", key: "documents", icon: FileCheck2 },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
}

/** Sidebar on desktop. */
export function DashboardSidebarNav() {
  const t = useTranslations("dashboard.nav");
  const isActive = useIsActive();

  return (
    <nav aria-label={t("label")} className="flex flex-col gap-1">
      {items.map(({ href, key, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
            isActive(href) ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}

/** Fixed bottom tab bar on phones (large tap targets). */
export function DashboardBottomNav() {
  const t = useTranslations("dashboard.nav");
  const isActive = useIsActive();

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ href, key, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold",
                isActive(href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon aria-hidden="true" className="h-6 w-6" />
              {t(key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
