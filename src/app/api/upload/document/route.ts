import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { getActingOwner } from "@/lib/auth/session";
import { ipFromRequest } from "@/lib/client-ip";
import { DOCUMENT_RULES, UPLOAD_LIMITS } from "@/lib/constants";
import { db } from "@/lib/db";
import { sanitizeFileName, sniffFileType } from "@/lib/file-validation";
import { refreshCompleteness } from "@/lib/profile/completeness";
import { rateLimit } from "@/lib/rate-limit";
import { storeFile } from "@/lib/storage";
import { documentMetaSchema } from "@/lib/validation/document";

export const runtime = "nodejs";

const json = (error: string, status: number, fieldErrors?: Record<string, string>) =>
  NextResponse.json({ error, fieldErrors }, { status });

/** Uploads a private legal document. It is stored privately and starts as PENDING. */
export async function POST(request: Request) {
  const owner = await getActingOwner();
  if (!owner) return json("unauthorized", 401);

  if (!rateLimit(`upload:${owner.user.id}`, 30, 60 * 60_000).ok) return json("rateLimited", 429);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json("invalidUpload", 400);
  }

  const meta = documentMetaSchema.safeParse({
    type: form.get("type"),
    number: form.get("number") ?? "",
    expiresAt: form.get("expiresAt") ?? "",
  });
  if (!meta.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of meta.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    return json("validation", 400, fieldErrors);
  }

  // A driver cannot upload fleet documents and vice versa.
  if (DOCUMENT_RULES[meta.data.type].owner !== owner.kind) return json("forbidden", 403);

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return json("invalidUpload", 400);
  if (file.size > UPLOAD_LIMITS.maxBytes) return json("fileTooLarge", 413);

  const body = Buffer.from(await file.arrayBuffer());
  const type = sniffFileType(body);
  if (!type) return json("unsupportedDocument", 415);

  // Prevent duplicates: one live (pending or approved) document per type.
  const ownerWhere = owner.kind === "DRIVER" ? { driverId: owner.profileId } : { fleetId: owner.profileId };
  const duplicate = await db.document.findFirst({
    where: { ...ownerWhere, type: meta.data.type, status: { in: ["PENDING", "APPROVED"] } },
    select: { id: true },
  });
  if (duplicate) return json("documentExists", 409);

  const fileName = sanitizeFileName(file.name);
  const stored = await storeFile({
    visibility: "private",
    key: `documents/${owner.kind.toLowerCase()}/${owner.profileId}/${randomUUID()}-${fileName}`,
    body,
    contentType: type.mime,
  });

  const document = await db.document.create({
    data: {
      ...ownerWhere,
      type: meta.data.type,
      number: meta.data.number || null,
      expiresAt: meta.data.expiresAt ? new Date(`${meta.data.expiresAt}T23:59:59.000Z`) : null,
      fileKey: stored.key,
      fileName,
      mimeType: type.mime,
      sizeBytes: body.length,
      uploadedById: owner.user.id,
    },
    select: { id: true },
  });

  await refreshCompleteness(owner.kind, owner.profileId);
  await writeAudit({
    actorId: owner.user.id,
    action: "document.upload",
    entityType: "Document",
    entityId: document.id,
    metadata: { type: meta.data.type },
    ip: ipFromRequest(request),
  });

  revalidatePath("/[locale]/dashboard", "layout");
  return NextResponse.json({ id: document.id }, { status: 201 });
}
