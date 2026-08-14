import { z } from "zod";
import { moneyInputSchema, optionalText, optionalInt } from "@/lib/validation/shared";

export const courseSchema = z.object({
  name: z.string().trim().min(1, "Course name is required."),
  kind: z.enum(["short_course", "programme"], {
    message: "Choose a course kind.",
  }),
  default_price: moneyInputSchema,
  default_weeks: optionalInt,
  description: optionalText,
});

export type CourseInput = z.infer<typeof courseSchema>;
