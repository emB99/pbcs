import { z } from "zod";
import { optionalText, optionalEmail } from "@/lib/validation/shared";

export const GENDERS = ["female", "male", "other"] as const;
export const STUDENT_STATUSES = ["active", "graduated", "withdrawn", "suspended"] as const;

const optionalPastDate = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const trimmed = v?.trim();
    if (!trimmed) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || Number.isNaN(Date.parse(trimmed))) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date." });
      return z.NEVER;
    }
    if (trimmed > new Date().toISOString().slice(0, 10)) {
      ctx.addIssue({ code: "custom", message: "Date of birth cannot be in the future." });
      return z.NEVER;
    }
    return trimmed;
  });

const optionalGender = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    if (!(GENDERS as readonly string[]).includes(v)) {
      ctx.addIssue({ code: "custom", message: "Choose a gender." });
      return z.NEVER;
    }
    return v;
  });

export const studentSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required."),
  phone: optionalText,
  email: optionalEmail,
  national_id: optionalText,
  address: optionalText,
  notes: optionalText,
  date_of_birth: optionalPastDate,
  gender: optionalGender,
  status: z.enum(STUDENT_STATUSES).default("active"),
});

export type StudentInput = z.infer<typeof studentSchema>;
