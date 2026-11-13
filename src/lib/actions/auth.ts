"use server";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { writeAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/client-ip";
import { db } from "@/lib/db";
import { normalizeLocale } from "@/lib/locale";
import { createProfileForUser } from "@/lib/profile/create";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { loginSchema, onboardingSchema, registerSchema } from "@/lib/validation/auth";
import { fail, zodFieldErrors, type ActionResult } from "./types";

type Redirect = { redirectTo: string };

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function registerAction(raw: unknown, locale: string): Promise<ActionResult<Redirect>> {
  const loc = normalizeLocale(locale);

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return fail("validation", zodFieldErrors(parsed.error.issues));

  const ip = await getClientIp();
  if (!rateLimit(`register:ip:${ip}`, 5, 10 * 60_000).ok) return fail("rateLimited");

  const { name, email, password, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return fail("emailTaken");

  const passwordHash = await bcrypt.hash(password, 12);

  let userId: string;
  try {
    userId = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash, role, locale: loc, consentAt: new Date() },
        select: { id: true },
      });
      await createProfileForUser(tx, { userId: user.id, role, name });
      return user.id;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return fail("emailTaken");
    throw error;
  }

  await writeAudit({ actorId: userId, action: "user.register", entityType: "User", entityId: userId, ip });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) return fail("loginAfterRegister");
    throw error;
  }

  return { ok: true, data: { redirectTo: `/${loc}/dashboard/profile` } };
}

export async function loginAction(raw: unknown, locale: string): Promise<ActionResult<Redirect>> {
  const loc = normalizeLocale(locale);

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return fail("validation", zodFieldErrors(parsed.error.issues));

  const ip = await getClientIp();
  const byIp = rateLimit(`login:ip:${ip}`, 30, 10 * 60_000);
  const byEmail = rateLimit(`login:email:${parsed.data.email}`, 8, 10 * 60_000);
  if (!byIp.ok || !byEmail.ok) return fail("rateLimited");

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Only a real CredentialsSignin means "wrong email or password".
      // Anything else (e.g. the database being unreachable) must not look like a bad password.
      if (error.type === "CredentialsSignin") return fail("invalidCredentials");
      console.error("[auth] login failed for a non-credentials reason:", error.type, error.cause);
      return fail("serviceUnavailable");
    }
    throw error;
  }

  return { ok: true, data: { redirectTo: `/${loc}/dashboard` } };
}

/** Lets a newly signed-in user (typically via Google) pick driver or fleet and accept the terms. */
export async function completeOnboardingAction(raw: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  if (user.role === "ADMIN") return fail("forbidden");
  if (user.driverProfile || user.fleetProfile) return fail("alreadyOnboarded");

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) return fail("validation", zodFieldErrors(parsed.error.issues));

  if (!user.consentAt && !parsed.data.consent) {
    return fail("validation", { consent: "consentRequired" });
  }

  const name = user.name?.trim() || user.email.split("@")[0] || "User";

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { role: parsed.data.role, consentAt: user.consentAt ?? new Date() },
      });
      await createProfileForUser(tx, { userId: user.id, role: parsed.data.role, name });
    });
  } catch (error) {
    if (isUniqueViolation(error)) return fail("alreadyOnboarded");
    throw error;
  }

  await writeAudit({
    actorId: user.id,
    action: "user.onboarded",
    entityType: "User",
    entityId: user.id,
    metadata: { role: parsed.data.role },
  });

  return { ok: true };
}