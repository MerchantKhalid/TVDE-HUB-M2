import { z } from "zod";
import { AVAILABILITY_STATUSES, SERVICE_TYPES } from "@/lib/constants";
import { isValidNif } from "@/lib/nif";
import { emailSchema } from "./auth";

const phone = z
  .string()
  .trim()
  .max(20, "tooLong")
  .refine((value) => value === "" || /^\+?[0-9 ()-]{7,20}$/.test(value), "invalidPhone");

const optionalText = (max: number) => z.string().trim().max(max, "tooLong");

const serviceTypes = z.array(z.enum(SERVICE_TYPES)).max(SERVICE_TYPES.length);
const idList = z.array(z.string().min(1)).max(40);
const languageCodes = z.array(z.string().min(2).max(5)).max(20);

export const driverProfileSchema = z.object({
  displayName: z.string("required").trim().min(2, "nameMin").max(60, "tooLong"),
  bio: optionalText(1500),
  phone,
  cityId: z.string(),
  yearsExperience: z
    .number("invalidNumber")
    .int("invalidNumber")
    .min(0, "invalidNumber")
    .max(60, "invalidNumber"),
  availability: z.enum(AVAILABILITY_STATUSES),
  serviceTypes,
  languages: languageCodes,
  serviceAreaIds: idList,
});

export const fleetProfileSchema = z.object({
  companyName: z.string("required").trim().min(2, "nameMin").max(80, "tooLong"),
  description: optionalText(2000),
  website: z
    .string()
    .trim()
    .max(200, "tooLong")
    .refine((value) => {
      if (value === "") return true;
      if (!/^https?:\/\//i.test(value)) return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, "invalidUrl"),
  contactEmail: z.union([z.literal(""), emailSchema]),
  phone,
  nif: z
    .string()
    .trim()
    .refine((value) => value === "" || isValidNif(value), "invalidNif"),
  operatorLicenceNumber: optionalText(40),
  cityId: z.string(),
  serviceTypes,
  termsOffered: optionalText(1500),
  showDriversPublicly: z.boolean(),
  languages: languageCodes,
  serviceAreaIds: idList,
});

export type DriverProfileInput = z.input<typeof driverProfileSchema>;
export type FleetProfileInput = z.input<typeof fleetProfileSchema>;
