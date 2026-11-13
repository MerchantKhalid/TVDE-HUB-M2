import { CheckCircle2, Circle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VisibilityCard } from "@/components/dashboard/visibility-card";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/navigation";
import { requireOnboarded } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { computeCompleteness } from "@/lib/profile/completeness";
import { getOwnerSummary } from "@/lib/profile/summary";
import { REQUIRED_FOR_VERIFIED } from "@/lib/verification";
import type { AvailabilityStatus } from "@prisma/client";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const statusVariant: Record<string, BadgeProps["variant"]> = {
  PENDING: "muted",
  APPROVED: "default",
  REJECTED: "accent",
  EXPIRED: "accent",
  MISSING: "outline",
};

export default async function DashboardOverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const owner = await requireOnboarded(locale);
  const t = await getTranslations("dashboard.overview");
  const tc = await getTranslations("completeness");
  const td = await getTranslations("documents");

  const [summary, report, docs, availability] = await Promise.all([
    getOwnerSummary(owner.kind, owner.profileId),
    computeCompleteness(owner.kind, owner.profileId),
    db.document.findMany({
      where: owner.kind === "DRIVER" ? { driverId: owner.profileId } : { fleetId: owner.profileId },
      orderBy: { createdAt: "desc" },
      select: { type: true, status: true, expiresAt: true },
    }),
    owner.kind === "DRIVER"
      ? db.driverProfile.findUnique({ where: { id: owner.profileId }, select: { availability: true } })
      : Promise.resolve(null),
  ]);

  const missing = report.checks.filter((check) => !check.done);

  const required = REQUIRED_FOR_VERIFIED[owner.kind].map((type) => {
    const latest = docs.find((doc) => doc.type === type);
    return { type, status: latest?.status ?? "MISSING", expiresAt: latest?.expiresAt ?? null };
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold md:text-3xl">{t("welcome", { name: summary.name })}</h1>
          {summary.verified ? <VerifiedBadge /> : <Badge variant="outline">{t("notVerified")}</Badge>}
        </div>
        <p className="text-muted-foreground">{t(owner.kind === "DRIVER" ? "subtitleDriver" : "subtitleFleet")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("completenessTitle")}</CardTitle>
            <CardDescription>{t("completenessDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <p className="font-heading text-4xl font-extrabold">{report.percent}%</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/profile">{t("editProfile")}</Link>
              </Button>
            </div>
            <Progress value={report.percent} label={t("completenessTitle")} />

            {missing.length === 0 ? (
              <Alert variant="success">{t("allDone")}</Alert>
            ) : (
              <ul className="space-y-1">
                {missing.map((check) => (
                  <li key={check.key}>
                    <Link
                      href={check.href}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm hover:bg-muted"
                    >
                      <Circle aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">{tc(`items.${check.key}`)}</span>
                      <span className="text-xs font-semibold text-muted-foreground">+{check.weight}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <VisibilityCard
          kind={owner.kind}
          published={summary.isPublished}
          publishable={report.publishable}
          blockers={report.publishBlockers}
          availability={(availability?.availability as AvailabilityStatus | undefined) ?? undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("verificationTitle")}</CardTitle>
          <CardDescription>{t("verificationDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y">
            {required.map((item) => (
              <li key={item.type} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {item.status === "APPROVED" ? (
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
                  )}
                  {td(`types.${item.type}`)}
                </span>
                <span className="flex items-center gap-2">
                  {item.expiresAt && (
                    <span className="text-xs text-muted-foreground">
                      {td("expires")}: {formatDate(locale, item.expiresAt)}
                    </span>
                  )}
                  <Badge variant={statusVariant[item.status]}>
                    {item.status === "MISSING" ? td("status.MISSING") : td(`status.${item.status}`)}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
          <Button asChild variant="outline">
            <Link href="/dashboard/documents">{t("manageDocuments")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
