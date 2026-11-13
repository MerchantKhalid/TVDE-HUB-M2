import { z } from "zod";

/** Validation messages are i18n keys under the "validation" namespace. */
export const passwordSchema = z
  .string("required")
  .min(10, "passwordMin")
  .max(128, "passwordMax")
  .regex(/[A-Za-z]/, "passwordLetter")
  .regex(/\d/, "passwordNumber");

export const emailSchema = z
  .string("required")
  .trim()
  .toLowerCase()
  .min(1, "required")
  .max(254, "tooLong")
  .pipe(z.email("invalidEmail"));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string("required").min(1, "required").max(128, "passwordMax"),
});

export const roleChoiceSchema = z.enum(["DRIVER", "FLEET"], "required");

export const registerSchema = z.object({
  name: z.string("required").trim().min(2, "nameMin").max(80, "tooLong"),
  email: emailSchema,
  password: passwordSchema,
  role: roleChoiceSchema,
  consent: z.literal(true, "consentRequired"),
});

export const onboardingSchema = z.object({
  role: roleChoiceSchema,
  consent: z.boolean(),
});

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type OnboardingInput = z.input<typeof onboardingSchema>;
