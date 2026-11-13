"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getActingOwner } from "@/lib/auth/session";
import { computeCompleteness, refreshCompleteness } from "@/lib/profile/completeness";
import { AVAILABILITY_STATUSES } from "@/lib/constants";
import { driverProfileSchema, fleetProfileSchema } from "@/lib/validation/profile";
import { fail, zodFieldErrors, type ActionResult } from "./types";

type Saved = { completeness: number; publishable: boolean };

const unique = <T,>(values: T[]) => Array.from(new Set(values));

/** Rejects ids/codes that do not exist, so the user gets a clean error instead of a database failure. */
async function referencesExist(input: { cityId: string; languages: string[]; regionIds: string[] }) {
  const [city, languages, regions] = await Promise.all([
    input.cityId ? db.city.count({ where: { id: input.cityId } }) : Promise.resolve(1),
    db.language.count({ where: { code: { in: input.languages } } }),
    db.region.count({ where: { id: { in: input.regionIds } } }),
  ]);
  return city === 1 && languages === input.languages.length && regions === input.regionIds.length;
}

export async function saveDriverProfileAction(raw: unknown): Promise<ActionResult<Saved>> {
  const owner = await getActingOwner();
  if (!owner || owner.kind !== "DRIVER") return fail("unauthorized");

  const parsed = driverProfileSchema.safeParse(raw);
  if (!parsed.success) return fail("validation", zodFieldErrors(parsed.error.issues));
  const data = parsed.data;

  const languages = unique(data.languages);
  const regionIds = unique(data.serviceAreaIds);
  if (!(await referencesExist({ cityId: data.cityId, languages, regionIds }))) return fail("invalidReference");

  await db.driverProfile.update({
    where: { id: owner.profileId },
    data: {
      displayName: data.displayName,
      bio: data.bio || null,
      phone: data.phone || null,
      cityId: data.cityId || null,
      yearsExperience: data.yearsExperience,
      availability: data.availability,
      serviceTypes: unique(data.serviceTypes),
      serviceAreas: { set: regionIds.map((id) => ({ id })) },
      languages: { deleteMany: {}, create: languages.map((languageCode) => ({ languageCode })) },
    },
  });

  const report = await refreshCompleteness("DRIVER", owner.profileId);
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true, data: { completeness: report.percent, publishable: report.publishable } };
}

export async function saveFleetProfileAction(raw: unknown): Promise<ActionResult<Saved>> {
  const owner = await getActingOwner();
  if (!owner || owner.kind !== "FLEET") return fail("unauthorized");

  const parsed = fleetProfileSchema.safeParse(raw);
  if (!parsed.success) return fail("validation", zodFieldErrors(parsed.error.issues));
  const data = parsed.data;

  const languages = unique(data.languages);
  const regionIds = unique(data.serviceAreaIds);
  if (!(await referencesExist({ cityId: data.cityId, languages, regionIds }))) return fail("invalidReference");

  await db.fleetProfile.update({
    where: { id: owner.profileId },
    data: {
      companyName: data.companyName,
      description: data.description || null,
      website: data.website || null,
      contactEmail: data.contactEmail || null,
      phone: data.phone || null,
      nif: data.nif || null,
      operatorLicenceNumber: data.operatorLicenceNumber || null,
      cityId: data.cityId || null,
      termsOffered: data.termsOffered || null,
      showDriversPublicly: data.showDriversPublicly,
      serviceTypes: unique(data.serviceTypes),
      serviceAreas: { set: regionIds.map((id) => ({ id })) },
      languages: { deleteMany: {}, create: languages.map((languageCode) => ({ languageCode })) },
    },
  });

  const report = await refreshCompleteness("FLEET", owner.profileId);
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true, data: { completeness: report.percent, publishable: report.publishable } };
}

/** Publishes or unpublishes the caller's own profile. Publishing needs the minimum data. */
export async function setPublishedAction(published: boolean): Promise<ActionResult> {
  const owner = await getActingOwner();
  if (!owner) return fail("unauthorized");
  if (typeof published !== "boolean") return fail("validation");

  if (published) {
    const report = await computeCompleteness(owner.kind, owner.profileId);
    if (!report.publishable) return fail("notPublishable");
  }

  if (owner.kind === "DRIVER") {
    await db.driverProfile.update({ where: { id: owner.profileId }, data: { isPublished: published } });
  } else {
    await db.fleetProfile.update({ where: { id: owner.profileId }, data: { isPublished: published } });
  }

  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

export async function setAvailabilityAction(status: string): Promise<ActionResult> {
  const owner = await getActingOwner();
  if (!owner || owner.kind !== "DRIVER") return fail("unauthorized");

  const valid = AVAILABILITY_STATUSES.find((candidate) => candidate === status);
  if (!valid) return fail("validation");

  await db.driverProfile.update({ where: { id: owner.profileId }, data: { availability: valid } });
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}
