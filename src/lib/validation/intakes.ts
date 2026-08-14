import { z } from "zod";
import { optionalText, optionalInt } from "@/lib/validation/shared";

export const intakeSchema = z.object({
  course_id: z.string().min(1, "Choose a course."),
  label: optionalText,
  start_date: z.string().min(1, "Start date is required."),
  end_date: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : null)),
  instructor_id: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v : null)),
  capacity: optionalInt,
});

export type IntakeInput = z.infer<typeof intakeSchema>;
