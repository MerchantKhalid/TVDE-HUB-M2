import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VehiclesManager } from "@/components/dashboard/vehicles-manager";
import { requireOnboarded } from "@/lib/auth/session";
import { UPLOAD_LIMITS } from "@/lib/constants";
import { db } from "@/lib/db";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function VehiclesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const owner = await requireOnboarded(locale);
  const t = await getTranslations("vehicles");

  const vehicles = await db.vehicle.findMany({
    where: owner.kind === "DRIVER" ? { driverId: owner.profileId } : { fleetId: owner.profileId },
    orderBy: { createdAt: "asc" },
    select: { id: true, make: true, model: true, year: true, type: true, seats: true, licensePlate: true },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t(owner.kind === "DRIVER" ? "titleDriver" : "titleFleet")}</h1>
        <p className="text-muted-foreground">{t(owner.kind === "DRIVER" ? "subtitleDriver" : "subtitleFleet")}</p>
      </header>
      <VehiclesManager
        vehicles={vehicles}
        maxVehicles={owner.kind === "DRIVER" ? UPLOAD_LIMITS.maxVehiclesDriver : UPLOAD_LIMITS.maxVehiclesFleet}
      />
    </div>
  );
}
