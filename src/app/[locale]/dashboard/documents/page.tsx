import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DocumentsManager } from "@/components/dashboard/documents-manager";
import { requireOnboarded } from "@/lib/auth/session";
import { documentTypesFor } from "@/lib/constants";
import { db } from "@/lib/db";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const owner = await requireOnboarded(locale);
  const t = await getTranslations("documents");

  const documents = await db.document.findMany({
    where: owner.kind === "DRIVER" ? { driverId: owner.profileId } : { fleetId: owner.profileId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      number: true,
      expiresAt: true,
      fileName: true,
      sizeBytes: true,
      rejectionReason: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t(owner.kind === "DRIVER" ? "subtitleDriver" : "subtitleFleet")}</p>
      </header>
      <DocumentsManager
        allowedTypes={documentTypesFor(owner.kind)}
        documents={documents.map((doc) => ({
          ...doc,
          expiresAt: doc.expiresAt?.toISOString() ?? null,
          createdAt: doc.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
