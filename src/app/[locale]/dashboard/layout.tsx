import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardBottomNav, DashboardSidebarNav } from "@/components/dashboard/dashboard-nav";
import { ProfileAvatar } from "@/components/shared/profile-avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Card } from "@/components/ui/card";
import { requireOnboarded } from "@/lib/auth/session";
import { getOwnerSummary } from "@/lib/profile/summary";

// Depends on the logged-in user, so it must never be prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const owner = await requireOnboarded(locale);
  const summary = await getOwnerSummary(owner.kind, owner.profileId);
  const t = await getTranslations("dashboard");

  return (
    <div className="container pb-28 pt-6 md:py-10">
      <div className="grid gap-8 md:grid-cols-[250px_1fr]">
        <aside className="hidden md:block">
          <div className="sticky top-24 space-y-4">
            <Card className="flex items-center gap-3 p-4">
              <ProfileAvatar name={summary.name} imageUrl={summary.imageUrl} size="md" />
              <div className="min-w-0 space-y-1">
                <p className="truncate font-heading font-bold">{summary.name}</p>
                <p className="text-xs text-muted-foreground">{t(owner.kind === "DRIVER" ? "roleDriver" : "roleFleet")}</p>
                {summary.verified && <VerifiedBadge />}
              </div>
            </Card>
            <DashboardSidebarNav />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
      <DashboardBottomNav />
    </div>
  );
}
