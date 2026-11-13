import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { googleEnabled } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { RegisterForm } from "@/components/auth/register-form";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
};

// Depends on the logged-in user, so it must never be prerendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("registerTitle"), robots: { index: false } };
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (await getCurrentUser()) return redirect({ href: "/dashboard", locale });

  const { role } = await searchParams;
  const initialRole = role === "driver" ? "DRIVER" : role === "fleet" ? "FLEET" : undefined;
  const t = await getTranslations("auth");

  return (
    <AuthShell
      title={t("registerTitle")}
      subtitle={t("registerSubtitle")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            {t("loginLink")}
          </Link>
        </>
      }
    >
      {googleEnabled && (
        <>
          <GoogleButton locale={locale} label={t("signUpWithGoogle")} />
          <p className="text-center text-xs text-muted-foreground">{t("googleOnboardingNote")}</p>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <RegisterForm initialRole={initialRole} />
    </AuthShell>
  );
}
