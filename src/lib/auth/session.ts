import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "@/i18n/navigation";
import type { OwnerKind } from "@/lib/constants";

/**
 * The authoritative current user. The JWT only proves *who* the person is; their role,
 * suspension status and profile are always read from the database, so a role change or a
 * suspension takes effect immediately. Cached per request.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      locale: true,
      consentAt: true,
      driverProfile: { select: { id: true } },
      fleetProfile: { select: { id: true } },
    },
  });

  if (!user || user.status !== "ACTIVE") return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For pages: send anonymous visitors to the login page. */
export async function requireUser(locale: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login", locale });
  return user;
}

export type Onboarded =
  | { kind: "DRIVER"; user: CurrentUser; profileId: string }
  | { kind: "FLEET"; user: CurrentUser; profileId: string };

/**
 * For dashboard pages: requires a logged-in DRIVER or FLEET user who has finished onboarding.
 * Admins go to /admin; users without a profile go to /onboarding.
 */
export async function requireOnboarded(locale: string): Promise<Onboarded> {
  const user = await requireUser(locale);
  if (user.role === "ADMIN") return redirect({ href: "/admin", locale });

  if (user.role === "DRIVER" && user.driverProfile) {
    return { kind: "DRIVER", user, profileId: user.driverProfile.id };
  }
  if (user.role === "FLEET" && user.fleetProfile) {
    return { kind: "FLEET", user, profileId: user.fleetProfile.id };
  }
  return redirect({ href: "/onboarding", locale });
}

export async function requireAdmin(locale: string): Promise<CurrentUser> {
  const user = await requireUser(locale);
  if (user.role !== "ADMIN") return redirect({ href: "/", locale });
  return user;
}

/**
 * For server actions and route handlers: resolves the acting DRIVER/FLEET owner, or null.
 * The profile id always comes from the session, never from client input, so users can
 * only ever act on their own records.
 */
export async function getActingOwner(): Promise<{
  user: CurrentUser;
  kind: OwnerKind;
  profileId: string;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "DRIVER" && user.driverProfile) {
    return { user, kind: "DRIVER", profileId: user.driverProfile.id };
  }
  if (user.role === "FLEET" && user.fleetProfile) {
    return { user, kind: "FLEET", profileId: user.fleetProfile.id };
  }
  return null;
}
