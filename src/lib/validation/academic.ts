import { z } from "zod";
import { optionalText } from "@/lib/validation/shared";

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  code: optionalText,
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");

export const termSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(60),
    academic_year: z.string().trim().min(1, "Enter the academic year.").max(20),
    start_date: isoDate,
    end_date: isoDate,
  })
  .refine((t) => t.end_date >= t.start_date, {
    message: "The end date must be on or after the start date.",
    path: ["end_date"],
  });

export const promoteSchema = z.object({
  target_intake_id: z.string().min(1, "Choose where to move them."),
  enrolment_ids: z.array(z.string()).min(1, "Choose at least one student."),
});
