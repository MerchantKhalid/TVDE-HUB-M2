import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { slugify } from "@/lib/utils";

type Tx = Prisma.TransactionClient;

function suffix(): string {
  return randomBytes(3).toString("hex");
}

export async function uniqueDriverSlug(tx: Tx, name: string): Promise<string> {
  const base = slugify(name) || "driver";
  let candidate = base;
  for (let attempt = 0; attempt < 6; attempt++) {
    const taken = await tx.driverProfile.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
    candidate = `${base}-${suffix()}`;
  }
  return `${base}-${randomBytes(6).toString("hex")}`;
}

export async function uniqueFleetSlug(tx: Tx, name: string): Promise<string> {
  const base = slugify(name) || "fleet";
  let candidate = base;
  for (let attempt = 0; attempt < 6; attempt++) {
    const taken = await tx.fleetProfile.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
    candidate = `${base}-${suffix()}`;
  }
  return `${base}-${randomBytes(6).toString("hex")}`;
}
