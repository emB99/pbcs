import { z } from "zod";
import { optionalText, optionalEmail } from "@/lib/validation/shared";

export const instructorSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required."),
  phone: optionalText,
  email: optionalEmail,
  notes: optionalText,
});

export type InstructorInput = z.infer<typeof instructorSchema>;
