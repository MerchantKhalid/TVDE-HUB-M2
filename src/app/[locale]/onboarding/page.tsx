import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/session";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
};

// Depends on the logged-in user, so it must never be prerendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("onboardingTitle"), robots: { index: false } };
}

export default async function OnboardingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await requireUser(locale);
  if (user.role === "ADMIN") return redirect({ href: "/admin", locale });
  if (user.driverProfile || user.fleetProfile) return redirect({ href: "/dashboard", locale });

  const { role } = await searchParams;
  const initialRole = role === "driver" ? "DRIVER" : role === "fleet" ? "FLEET" : undefined;
  const t = await getTranslations("auth");

  return (
    <AuthShell title={t("onboardingTitle")} subtitle={t("onboardingSubtitle")}>
      <OnboardingForm needsConsent={!user.consentAt} initialRole={initialRole} />
    </AuthShell>
  );
}
