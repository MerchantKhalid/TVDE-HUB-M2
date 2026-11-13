"use client";

import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type AuthButtonsProps = { layout: "desktop" | "mobile" };

/** Login/register or dashboard/logout, depending on the session. Client-side so public pages stay cacheable. */
export function AuthButtons({ layout }: AuthButtonsProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { status } = useSession();
  const size = layout === "mobile" ? "lg" : "default";

  if (status === "loading") {
    return <div aria-hidden="true" className="h-11 w-44 animate-pulse rounded-xl bg-muted" />;
  }

  if (status === "authenticated") {
    return (
      <>
        <Button asChild variant={layout === "mobile" ? "default" : "ghost"} size={size}>
          <Link href="/dashboard">{t("dashboard")}</Link>
        </Button>
        <Button
          type="button"
          variant={layout === "mobile" ? "outline" : "accent"}
          size={size}
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
        >
          {t("logout")}
        </Button>
      </>
    );
  }

  return (
    <>
      <Button asChild variant={layout === "mobile" ? "outline" : "ghost"} size={size}>
        <Link href="/login">{t("login")}</Link>
      </Button>
      <Button asChild variant="accent" size={size}>
        <Link href="/register">{t("register")}</Link>
      </Button>
    </>
  );
}
