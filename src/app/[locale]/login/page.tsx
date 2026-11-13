import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { googleEnabled } from "@/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { Alert } from "@/components/ui/alert";
import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

// Depends on the logged-in user, so it must never be prerendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("loginTitle"), robots: { index: false } };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (await getCurrentUser()) return redirect({ href: "/dashboard", locale });

  const { error } = await searchParams;
  const t = await getTranslations("auth");
  const te = await getTranslations("errors");

  const oauthError = error
    ? error === "OAuthAccountNotLinked"
      ? te("oauthNotLinked")
      : te("oauthError")
    : null;

  return (
    <AuthShell
      title={t("loginTitle")}
      subtitle={t("loginSubtitle")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            {t("createAccount")}
          </Link>
        </>
      }
    >
      {oauthError && <Alert variant="error">{oauthError}</Alert>}
      {googleEnabled && (
        <>
          <GoogleButton locale={locale} label={t("continueWithGoogle")} />
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <LoginForm />
    </AuthShell>
  );
}
