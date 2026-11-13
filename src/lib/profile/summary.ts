import { db } from "@/lib/db";
import type { OwnerKind } from "@/lib/constants";

export type OwnerSummary = {
  name: string;
  imageUrl: string | null;
  verified: boolean;
  isPublished: boolean;
  completeness: number;
  slug: string;
};

export async function getOwnerSummary(kind: OwnerKind, profileId: string): Promise<OwnerSummary> {
  if (kind === "DRIVER") {
    const p = await db.driverProfile.findUniqueOrThrow({
      where: { id: profileId },
      select: { displayName: true, photoUrl: true, verified: true, isPublished: true, completeness: true, slug: true },
    });
    return {
      name: p.displayName,
      imageUrl: p.photoUrl,
      verified: p.verified,
      isPublished: p.isPublished,
      completeness: p.completeness,
      slug: p.slug,
    };
  }

  const p = await db.fleetProfile.findUniqueOrThrow({
    where: { id: profileId },
    select: { companyName: true, logoUrl: true, verified: true, isPublished: true, completeness: true, slug: true },
  });
  return {
    name: p.companyName,
    imageUrl: p.logoUrl,
    verified: p.verified,
    isPublished: p.isPublished,
    completeness: p.completeness,
    slug: p.slug,
  };
}
