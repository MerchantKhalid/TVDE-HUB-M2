import { z } from "zod";
import { DOCUMENT_RULES, DOCUMENT_TYPES } from "@/lib/constants";

export const documentMetaSchema = z
  .object({
    type: z.enum(DOCUMENT_TYPES, "required"),
    number: z.string().trim().max(40, "tooLong"),
    /** yyyy-mm-dd from <input type="date"> */
    expiresAt: z
      .string()
      .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "invalidDate"),
  })
  .superRefine((value, ctx) => {
    const rule = DOCUMENT_RULES[value.type];
    if (rule.numberRequired && value.number === "") {
      ctx.addIssue({ code: "custom", path: ["number"], message: "required" });
    }
    if (rule.expiryRequired && value.expiresAt === "") {
      ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "required" });
    }
    if (value.expiresAt !== "") {
      const expiry = new Date(`${value.expiresAt}T23:59:59.000Z`);
      if (Number.isNaN(expiry.getTime())) {
        ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "invalidDate" });
      } else if (expiry.getTime() < Date.now()) {
        ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "expiryPast" });
      }
    }
  });

export type DocumentMetaInput = z.input<typeof documentMetaSchema>;
