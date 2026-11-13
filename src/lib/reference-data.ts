import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export type LanguageOption = { code: string; nameEn: string; namePt: string; flag: string };
export type RegionOption = { id: string; name: string; highlighted: boolean };
export type CityGroup = { regionId: string; regionName: string; cities: Array<{ id: string; name: string }> };

export type ReferenceData = {
  languages: LanguageOption[];
  regions: RegionOption[];
  cityGroups: CityGroup[];
};

/** Languages, regions and cities change rarely, so they are cached for an hour. */
export const getReferenceData = unstable_cache(
  async (): Promise<ReferenceData> => {
    const [languages, regions] = await Promise.all([
      db.language.findMany({ orderBy: { nameEn: "asc" } }),
      db.region.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { cities: { orderBy: { name: "asc" } } },
      }),
    ]);

    return {
      languages,
      regions: regions.map((region) => ({
        id: region.id,
        name: region.name,
        highlighted: region.highlighted,
      })),
      cityGroups: regions
        .filter((region) => region.cities.length > 0)
        .map((region) => ({
          regionId: region.id,
          regionName: region.name,
          cities: region.cities.map((city) => ({ id: city.id, name: city.name })),
        })),
    };
  },
  ["reference-data-v1"],
  { revalidate: 3600, tags: ["reference-data"] },
);
