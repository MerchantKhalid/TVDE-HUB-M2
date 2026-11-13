import { z } from "zod";
import { VEHICLE_TYPES } from "@/lib/constants";

export const vehicleSchema = z.object({
  make: z.string("required").trim().min(1, "required").max(40, "tooLong"),
  model: z.string("required").trim().min(1, "required").max(40, "tooLong"),
  year: z
    .number("invalidNumber")
    .int("invalidNumber")
    .min(1990, "invalidYear")
    .max(new Date().getFullYear() + 1, "invalidYear"),
  type: z.enum(VEHICLE_TYPES, "required"),
  seats: z.number("invalidNumber").int("invalidNumber").min(1, "invalidNumber").max(9, "invalidNumber"),
  licensePlate: z.string().trim().max(12, "tooLong"),
});

export type VehicleInput = z.input<typeof vehicleSchema>;
