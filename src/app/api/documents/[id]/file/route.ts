import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { ipFromRequest } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { readPrivateFile } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Streams a private document. Only the owner or an admin may read it.
 * Admin views of someone else's document are written to the audit log (GDPR).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const document = await db.document.findUnique({
    where: { id },
    select: {
      id: true,
      fileKey: true,
      fileName: true,
      mimeType: true,
      driver: { select: { userId: true } },
      fleet: { select: { userId: true } },
    },
  });

  const isOwner = document?.driver?.userId === user.id || document?.fleet?.userId === user.id;
  const isAdmin = user.role === "ADMIN";

  // 404 (not 403) so the existence of other people's documents is not revealed.
  if (!document || (!isOwner && !isAdmin)) return new NextResponse("Not found", { status: 404 });

  const file = await readPrivateFile(document.fileKey);
  if (!file) return new NextResponse("Not found", { status: 404 });

  if (isAdmin && !isOwner) {
    await writeAudit({
      actorId: user.id,
      action: "document.view",
      entityType: "Document",
      entityId: document.id,
      ip: ipFromRequest(request),
    });
  }

  const headers = new Headers({
    "Content-Type": document.mimeType,
    "Content-Disposition": `inline; filename="${document.fileName.replace(/"/g, "")}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (file.size !== null) headers.set("Content-Length", String(file.size));

  return new Response(file.stream, { headers });
}
