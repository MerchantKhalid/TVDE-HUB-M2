"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ChipOption } from "@/components/ui/chip-group";
import { SERVICE_TYPES, VEHICLE_TYPES } from "@/lib/constants";
import type { LanguageOption, RegionOption } from "@/lib/reference-data";

export function useServiceTypeOptions(): ChipOption[] {
  const t = useTranslations("enums.serviceType");
  return SERVICE_TYPES.map((value) => ({ value, label: t(value) }));
}

export function useVehicleTypeOptions(): ChipOption[] {
  const t = useTranslations("enums.vehicleType");
  return VEHICLE_TYPES.map((value) => ({ value, label: t(value) }));
}

export function useLanguageOptions(languages: LanguageOption[]): ChipOption[] {
  const locale = useLocale();
  return languages.map((language) => ({
    value: language.code,
    label: locale === "pt" ? language.namePt : language.nameEn,
    prefix: language.flag,
  }));
}

export function regionOptions(regions: RegionOption[]): ChipOption[] {
  return regions.map((region) => ({ value: region.id, label: region.name }));
}
