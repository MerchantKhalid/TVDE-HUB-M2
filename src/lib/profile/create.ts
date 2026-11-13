import type { Prisma, Role } from "@prisma/client";
import { uniqueDriverSlug, uniqueFleetSlug } from "./slug";

type Tx = Prisma.TransactionClient;

/** Creates the empty (unpublished) profile that matches the chosen role. */
export async function createProfileForUser(
  tx: Tx,
  input: { userId: string; role: Extract<Role, "DRIVER" | "FLEET">; name: string },
) {
  if (input.role === "DRIVER") {
    const slug = await uniqueDriverSlug(tx, input.name);
    await tx.driverProfile.create({
      data: { userId: input.userId, slug, displayName: input.name },
    });
    return;
  }

  const slug = await uniqueFleetSlug(tx, input.name);
  await tx.fleetProfile.create({
    data: { userId: input.userId, slug, companyName: input.name },
  });
}
