import type { DocumentType } from "@prisma/client";
import { db } from "@/lib/db";
import type { OwnerKind } from "@/lib/constants";

/** A profile is "Verified" only when every one of these is APPROVED and not expired. */
export const REQUIRED_FOR_VERIFIED: Record<OwnerKind, readonly DocumentType[]> = {
  DRIVER: ["TVDE_DRIVER_CERTIFICATE", "DRIVING_LICENCE", "CRIMINAL_RECORD"],
  FLEET: ["TVDE_OPERATOR_LICENCE", "NIF", "INSURANCE"],
};

/**
 * Recomputes the `verified` flag from the current documents.
 * Called when a document is deleted here, and reused by the admin panel (M5) and expiry cron.
 */
export async function recomputeVerified(kind: OwnerKind, profileId: string): Promise<boolean> {
  const now = new Date();
  const approved = await db.document.findMany({
    where: kind === "DRIVER" ? { driverId: profileId, status: "APPROVED" } : { fleetId: profileId, status: "APPROVED" },
    select: { type: true, expiresAt: true },
  });

  const valid = new Set(
    approved.filter((doc) => !doc.expiresAt || doc.expiresAt > now).map((doc) => doc.type),
  );
  const verified = REQUIRED_FOR_VERIFIED[kind].every((type) => valid.has(type));

  if (kind === "DRIVER") {
    await db.driverProfile.update({ where: { id: profileId }, data: { verified } });
  } else {
    await db.fleetProfile.update({ where: { id: profileId }, data: { verified } });
  }
  return verified;
}
