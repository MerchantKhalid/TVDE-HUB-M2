import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DriverProfileForm } from "@/components/dashboard/driver-profile-form";
import { FleetProfileForm } from "@/components/dashboard/fleet-profile-form";
import { requireOnboarded } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getReferenceData } from "@/lib/reference-data";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const owner = await requireOnboarded(locale);
  const t = await getTranslations("profile");
  const reference = await getReferenceData();

  if (owner.kind === "DRIVER") {
    const profile = await db.driverProfile.findUniqueOrThrow({
      where: { id: owner.profileId },
      include: { languages: true, serviceAreas: { select: { id: true } } },
    });

    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-extrabold md:text-3xl">{t("driverTitle")}</h1>
          <p className="text-muted-foreground">{t("driverSubtitle")}</p>
        </header>
        <DriverProfileForm
          photoUrl={profile.photoUrl}
          reference={reference}
          initial={{
            displayName: profile.displayName,
            bio: profile.bio ?? "",
            phone: profile.phone ?? "",
            cityId: profile.cityId ?? "",
            yearsExperience: profile.yearsExperience,
            availability: profile.availability,
            serviceTypes: profile.serviceTypes,
            languages: profile.languages.map((l) => l.languageCode),
            serviceAreaIds: profile.serviceAreas.map((a) => a.id),
          }}
        />
      </div>
    );
  }

  const profile = await db.fleetProfile.findUniqueOrThrow({
    where: { id: owner.profileId },
    include: { languages: true, serviceAreas: { select: { id: true } } },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold md:text-3xl">{t("fleetTitle")}</h1>
        <p className="text-muted-foreground">{t("fleetSubtitle")}</p>
      </header>
      <FleetProfileForm
        logoUrl={profile.logoUrl}
        reference={reference}
        initial={{
          companyName: profile.companyName,
          description: profile.description ?? "",
          website: profile.website ?? "",
          contactEmail: profile.contactEmail ?? "",
          phone: profile.phone ?? "",
          nif: profile.nif ?? "",
          operatorLicenceNumber: profile.operatorLicenceNumber ?? "",
          cityId: profile.cityId ?? "",
          serviceTypes: profile.serviceTypes,
          termsOffered: profile.termsOffered ?? "",
          showDriversPublicly: profile.showDriversPublicly,
          languages: profile.languages.map((l) => l.languageCode),
          serviceAreaIds: profile.serviceAreas.map((a) => a.id),
        }}
      />
    </div>
  );
}
