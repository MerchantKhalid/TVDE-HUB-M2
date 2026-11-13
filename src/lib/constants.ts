import type {
  AvailabilityStatus,
  DocumentStatus,
  DocumentType,
  ServiceType,
  VehicleType,
} from "@prisma/client";

export const SERVICE_TYPES = [
  "TVDE_RIDES",
  "TOURS_AND_TRANSFERS",
  "AIRPORT_TRANSFERS",
  "CORPORATE_EVENTS",
] as const satisfies readonly ServiceType[];

export const VEHICLE_TYPES = [
  "STANDARD",
  "VAN_MPV",
  "ELECTRIC",
  "PREMIUM",
] as const satisfies readonly VehicleType[];

export const AVAILABILITY_STATUSES = [
  "AVAILABLE",
  "BUSY",
  "OFFLINE",
] as const satisfies readonly AvailabilityStatus[];

export const DOCUMENT_TYPES = [
  "TVDE_DRIVER_CERTIFICATE",
  "DRIVING_LICENCE",
  "CRIMINAL_RECORD",
  "TVDE_OPERATOR_LICENCE",
  "NIF",
  "INSURANCE",
] as const satisfies readonly DocumentType[];

export const DOCUMENT_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
] as const satisfies readonly DocumentStatus[];

export type OwnerKind = "DRIVER" | "FLEET";

export type DocumentRule = {
  owner: OwnerKind;
  numberRequired: boolean;
  expiryRequired: boolean;
};

/** Which documents each kind of profile uploads, and what metadata is mandatory. */
export const DOCUMENT_RULES: Record<DocumentType, DocumentRule> = {
  TVDE_DRIVER_CERTIFICATE: { owner: "DRIVER", numberRequired: true, expiryRequired: true },
  DRIVING_LICENCE: { owner: "DRIVER", numberRequired: true, expiryRequired: true },
  CRIMINAL_RECORD: { owner: "DRIVER", numberRequired: false, expiryRequired: false },
  TVDE_OPERATOR_LICENCE: { owner: "FLEET", numberRequired: true, expiryRequired: true },
  NIF: { owner: "FLEET", numberRequired: true, expiryRequired: false },
  INSURANCE: { owner: "FLEET", numberRequired: true, expiryRequired: true },
};

export function documentTypesFor(owner: OwnerKind): DocumentType[] {
  return DOCUMENT_TYPES.filter((type) => DOCUMENT_RULES[type].owner === owner);
}

export const UPLOAD_LIMITS = {
  /** Vercel serverless functions accept request bodies up to 4.5 MB. */
  maxBytes: 4 * 1024 * 1024,
  maxVehiclesDriver: 5,
  maxVehiclesFleet: 200,
} as const;
