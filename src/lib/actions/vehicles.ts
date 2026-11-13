"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getActingOwner } from "@/lib/auth/session";
import { UPLOAD_LIMITS } from "@/lib/constants";
import { refreshCompleteness } from "@/lib/profile/completeness";
import { vehicleSchema } from "@/lib/validation/vehicle";
import { fail, zodFieldErrors, type ActionResult } from "./types";

export async function addVehicleAction(raw: unknown): Promise<ActionResult> {
  const owner = await getActingOwner();
  if (!owner) return fail("unauthorized");

  const parsed = vehicleSchema.safeParse(raw);
  if (!parsed.success) return fail("validation", zodFieldErrors(parsed.error.issues));

  const ownerWhere = owner.kind === "DRIVER" ? { driverId: owner.profileId } : { fleetId: owner.profileId };
  const max = owner.kind === "DRIVER" ? UPLOAD_LIMITS.maxVehiclesDriver : UPLOAD_LIMITS.maxVehiclesFleet;
  if ((await db.vehicle.count({ where: ownerWhere })) >= max) return fail("vehicleLimit");

  await db.vehicle.create({
    data: {
      ...ownerWhere,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      type: parsed.data.type,
      seats: parsed.data.seats,
      licensePlate: parsed.data.licensePlate || null,
    },
  });

  await refreshCompleteness(owner.kind, owner.profileId);
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

export async function deleteVehicleAction(vehicleId: string): Promise<ActionResult> {
  const owner = await getActingOwner();
  if (!owner) return fail("unauthorized");
  if (typeof vehicleId !== "string" || vehicleId.length === 0) return fail("validation");

  // The owner filter is what enforces "users can only act on their own records".
  const ownerWhere = owner.kind === "DRIVER" ? { driverId: owner.profileId } : { fleetId: owner.profileId };
  const { count } = await db.vehicle.deleteMany({ where: { id: vehicleId, ...ownerWhere } });
  if (count === 0) return fail("notFound");

  await refreshCompleteness(owner.kind, owner.profileId);
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}
