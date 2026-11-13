"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { getActingOwner } from "@/lib/auth/session";
import { refreshCompleteness } from "@/lib/profile/completeness";
import { deleteFile } from "@/lib/storage";
import { recomputeVerified } from "@/lib/verification";
import { fail, type ActionResult } from "./types";

export async function deleteDocumentAction(documentId: string): Promise<ActionResult> {
  const owner = await getActingOwner();
  if (!owner) return fail("unauthorized");
  if (typeof documentId !== "string" || documentId.length === 0) return fail("validation");

  const ownerWhere = owner.kind === "DRIVER" ? { driverId: owner.profileId } : { fleetId: owner.profileId };
  const document = await db.document.findFirst({
    where: { id: documentId, ...ownerWhere },
    select: { id: true, fileKey: true, type: true, status: true },
  });
  if (!document) return fail("notFound");

  await db.document.delete({ where: { id: document.id } });
  await deleteFile("private", document.fileKey);

  // Removing an approved document can remove the Verified badge.
  await recomputeVerified(owner.kind, owner.profileId);
  await refreshCompleteness(owner.kind, owner.profileId);

  await writeAudit({
    actorId: owner.user.id,
    action: "document.delete",
    entityType: "Document",
    entityId: document.id,
    metadata: { type: document.type, status: document.status },
    ip: await getClientIp(),
  });

  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}
