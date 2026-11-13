import type { DocumentType } from "@prisma/client";
import { db } from "@/lib/db";
import type { OwnerKind } from "@/lib/constants";

export type CompletenessCheck = {
  /** i18n key under "completeness.items" */
  key: string;
  weight: number;
  done: boolean;
  /** Dashboard page where the user can fix it */
  href: "/dashboard/profile" | "/dashboard/vehicles" | "/dashboard/documents";
};

export type CompletenessReport = {
  percent: number;
  checks: CompletenessCheck[];
  /** Minimum data needed before a profile may be published */
  publishable: boolean;
  publishBlockers: string[];
};

type Snapshot = {
  hasName: boolean;
  hasImage: boolean;
  hasText: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasCity: boolean;
  languageCount: number;
  serviceTypeCount: number;
  areaCount: number;
  vehicleCount: number;
  documentTypes: Set<DocumentType>;
};

const P = "/dashboard/profile" as const;
const V = "/dashboard/vehicles" as const;
const D = "/dashboard/documents" as const;

function driverChecks(s: Snapshot): CompletenessCheck[] {
  return [
    { key: "photo", weight: 15, done: s.hasImage, href: P },
    { key: "bio", weight: 15, done: s.hasText, href: P },
    { key: "phone", weight: 5, done: s.hasPhone, href: P },
    { key: "city", weight: 10, done: s.hasCity, href: P },
    { key: "languages", weight: 10, done: s.languageCount > 0, href: P },
    { key: "serviceTypes", weight: 10, done: s.serviceTypeCount > 0, href: P },
    { key: "serviceAreas", weight: 5, done: s.areaCount > 0, href: P },
    { key: "vehicle", weight: 10, done: s.vehicleCount > 0, href: V },
    { key: "docTvdeCertificate", weight: 10, done: s.documentTypes.has("TVDE_DRIVER_CERTIFICATE"), href: D },
    { key: "docDrivingLicence", weight: 5, done: s.documentTypes.has("DRIVING_LICENCE"), href: D },
    { key: "docCriminalRecord", weight: 5, done: s.documentTypes.has("CRIMINAL_RECORD"), href: D },
  ];
}

function fleetChecks(s: Snapshot): CompletenessCheck[] {
  return [
    { key: "logo", weight: 15, done: s.hasImage, href: P },
    { key: "description", weight: 15, done: s.hasText, href: P },
    { key: "phone", weight: 5, done: s.hasPhone, href: P },
    { key: "contactEmail", weight: 5, done: s.hasEmail, href: P },
    { key: "city", weight: 10, done: s.hasCity, href: P },
    { key: "languages", weight: 5, done: s.languageCount > 0, href: P },
    { key: "serviceTypes", weight: 10, done: s.serviceTypeCount > 0, href: P },
    { key: "serviceAreas", weight: 5, done: s.areaCount > 0, href: P },
    { key: "vehicle", weight: 10, done: s.vehicleCount > 0, href: V },
    { key: "docOperatorLicence", weight: 10, done: s.documentTypes.has("TVDE_OPERATOR_LICENCE"), href: D },
    { key: "docNif", weight: 5, done: s.documentTypes.has("NIF"), href: D },
    { key: "docInsurance", weight: 5, done: s.documentTypes.has("INSURANCE"), href: D },
  ];
}

export function buildReport(kind: OwnerKind, snapshot: Snapshot): CompletenessReport {
  const checks = kind === "DRIVER" ? driverChecks(snapshot) : fleetChecks(snapshot);
  const percent = checks.reduce((total, check) => total + (check.done ? check.weight : 0), 0);

  const publishBlockers: string[] = [];
  if (!snapshot.hasName) publishBlockers.push("name");
  if (!snapshot.hasCity) publishBlockers.push("city");
  if (snapshot.languageCount === 0) publishBlockers.push("languages");
  if (snapshot.serviceTypeCount === 0) publishBlockers.push("serviceTypes");

  return { percent, checks, publishable: publishBlockers.length === 0, publishBlockers };
}

/** Reads the database and builds the report for a profile. */
export async function computeCompleteness(kind: OwnerKind, profileId: string): Promise<CompletenessReport> {
  if (kind === "DRIVER") {
    const [profile, docs] = await Promise.all([
      db.driverProfile.findUnique({
        where: { id: profileId },
        select: {
          displayName: true,
          photoUrl: true,
          bio: true,
          phone: true,
          cityId: true,
          serviceTypes: true,
          _count: { select: { languages: true, serviceAreas: true, vehicles: true } },
        },
      }),
      db.document.findMany({ where: { driverId: profileId }, select: { type: true }, distinct: ["type"] }),
    ]);
    if (!profile) throw new Error("Driver profile not found");

    return buildReport("DRIVER", {
      hasName: profile.displayName.trim().length >= 2,
      hasImage: Boolean(profile.photoUrl),
      hasText: (profile.bio ?? "").trim().length >= 40,
      hasPhone: Boolean(profile.phone),
      hasEmail: true,
      hasCity: Boolean(profile.cityId),
      languageCount: profile._count.languages,
      serviceTypeCount: profile.serviceTypes.length,
      areaCount: profile._count.serviceAreas,
      vehicleCount: profile._count.vehicles,
      documentTypes: new Set(docs.map((doc) => doc.type)),
    });
  }

  const [profile, docs] = await Promise.all([
    db.fleetProfile.findUnique({
      where: { id: profileId },
      select: {
        companyName: true,
        logoUrl: true,
        description: true,
        phone: true,
        contactEmail: true,
        cityId: true,
        serviceTypes: true,
        _count: { select: { languages: true, serviceAreas: true, vehicles: true } },
      },
    }),
    db.document.findMany({ where: { fleetId: profileId }, select: { type: true }, distinct: ["type"] }),
  ]);
  if (!profile) throw new Error("Fleet profile not found");

  return buildReport("FLEET", {
    hasName: profile.companyName.trim().length >= 2,
    hasImage: Boolean(profile.logoUrl),
    hasText: (profile.description ?? "").trim().length >= 40,
    hasPhone: Boolean(profile.phone),
    hasEmail: Boolean(profile.contactEmail),
    hasCity: Boolean(profile.cityId),
    languageCount: profile._count.languages,
    serviceTypeCount: profile.serviceTypes.length,
    areaCount: profile._count.serviceAreas,
    vehicleCount: profile._count.vehicles,
    documentTypes: new Set(docs.map((doc) => doc.type)),
  });
}

/**
 * Recomputes and stores `completeness`. If the profile is published but no longer meets
 * the minimum requirements, it is automatically unpublished.
 */
export async function refreshCompleteness(kind: OwnerKind, profileId: string): Promise<CompletenessReport> {
  const report = await computeCompleteness(kind, profileId);

  if (kind === "DRIVER") {
    await db.driverProfile.update({
      where: { id: profileId },
      data: { completeness: report.percent },
    });
    if (!report.publishable) {
      await db.driverProfile.updateMany({ where: { id: profileId, isPublished: true }, data: { isPublished: false } });
    }
  } else {
    await db.fleetProfile.update({
      where: { id: profileId },
      data: { completeness: report.percent },
    });
    if (!report.publishable) {
      await db.fleetProfile.updateMany({ where: { id: profileId, isPublished: true }, data: { isPublished: false } });
    }
  }

  return report;
}
