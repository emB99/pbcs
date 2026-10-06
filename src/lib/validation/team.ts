import { z } from "zod";

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["admin", "staff", "teacher"], { message: "Choose a role." }),
});

export const changeRoleSchema = z.object({
  role: z.enum(["owner", "admin", "staff", "teacher"]),
});

const termPart = z.string().trim().max(40);

export const schoolSettingsSchema = z.object({
  name: z.string().trim().min(1, "Enter your school's name.").max(120),
  school_type: z.enum(["college", "k12"]),
  student_number_prefix: z
    .string()
    .trim()
    .min(1, "Enter a prefix.")
    .max(8, "Keep the prefix to 8 characters or fewer.")
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers or hyphens only."),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().email("Enter a valid email address.").nullable()),
  phone: z.string().trim().optional().transform((v) => (v ? v : null)),
  address: z.string().trim().optional().transform((v) => (v ? v : null)),
  receipt_prefix: z
    .string()
    .trim()
    .max(10, "Keep prefixes to 10 characters or fewer.")
    .regex(/^[A-Za-z0-9/-]*$/, "Prefixes can use letters, numbers, hyphens and slashes."),
  invoice_prefix: z
    .string()
    .trim()
    .max(10, "Keep prefixes to 10 characters or fewer.")
    .regex(/^[A-Za-z0-9/-]*$/, "Prefixes can use letters, numbers, hyphens and slashes."),
  document_footer: z
    .string()
    .trim()
    .max(500, "Keep the footer to 500 characters or fewer.")
    .optional()
    .transform((v) => (v ? v : null)),
  terminology: z.record(z.string(), z.object({ one: termPart, many: termPart }).partial()),
});
