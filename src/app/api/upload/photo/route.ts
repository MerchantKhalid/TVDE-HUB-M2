import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getActingOwner } from "@/lib/auth/session";
import { UPLOAD_LIMITS } from "@/lib/constants";
import { db } from "@/lib/db";
import { isImage, sniffFileType } from "@/lib/file-validation";
import { refreshCompleteness } from "@/lib/profile/completeness";
import { rateLimit } from "@/lib/rate-limit";
import { deleteFile, storeFile } from "@/lib/storage";

export const runtime = "nodejs";

const json = (error: string, status: number) => NextResponse.json({ error }, { status });

async function currentPhoto(kind: "DRIVER" | "FLEET", profileId: string): Promise<string | null> {
  if (kind === "DRIVER") {
    const profile = await db.driverProfile.findUnique({ where: { id: profileId }, select: { photoUrl: true } });
    return profile?.photoUrl ?? null;
  }
  const profile = await db.fleetProfile.findUnique({ where: { id: profileId }, select: { logoUrl: true } });
  return profile?.logoUrl ?? null;
}

async function setPhoto(kind: "DRIVER" | "FLEET", profileId: string, url: string | null) {
  if (kind === "DRIVER") {
    await db.driverProfile.update({ where: { id: profileId }, data: { photoUrl: url } });
  } else {
    await db.fleetProfile.update({ where: { id: profileId }, data: { logoUrl: url } });
  }
}

/** Uploads a driver photo or fleet logo (public). */
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

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return json("invalidUpload", 400);
  if (file.size > UPLOAD_LIMITS.maxBytes) return json("fileTooLarge", 413);

  const body = Buffer.from(await file.arrayBuffer());
  const type = sniffFileType(body);
  if (!isImage(type)) return json("unsupportedImage", 415);

  const previous = await currentPhoto(owner.kind, owner.profileId);

  const stored = await storeFile({
    visibility: "public",
    key: `${owner.kind.toLowerCase()}/${owner.profileId}/${randomUUID()}.${type.ext}`,
    body,
    contentType: type.mime,
  });
  if (!stored.url) return json("uploadFailed", 500);

  await setPhoto(owner.kind, owner.profileId, stored.url);
  if (previous) await deleteFile("public", previous);

  await refreshCompleteness(owner.kind, owner.profileId);
  revalidatePath("/[locale]/dashboard", "layout");
  return NextResponse.json({ url: stored.url });
}

/** Removes the current photo / logo. */
export async function DELETE() {
  const owner = await getActingOwner();
  if (!owner) return json("unauthorized", 401);

  const previous = await currentPhoto(owner.kind, owner.profileId);
  await setPhoto(owner.kind, owner.profileId, null);
  if (previous) await deleteFile("public", previous);

  await refreshCompleteness(owner.kind, owner.profileId);
  revalidatePath("/[locale]/dashboard", "layout");
  return NextResponse.json({ ok: true });
}
