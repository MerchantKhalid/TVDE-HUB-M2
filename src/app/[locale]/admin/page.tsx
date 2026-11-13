import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Alert } from "@/components/ui/alert";
import { requireAdmin } from "@/lib/auth/session";

// Depends on the logged-in user, so it must never be prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false } };

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin");

  return (
    <div className="container max-w-3xl space-y-6 py-12">
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("welcome", { email: admin.email })}</p>
      <Alert variant="info">{t("comingSoon")}</Alert>
    </div>
  );
}
