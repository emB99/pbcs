import { z } from "zod";
import { optionalText, optionalEmail } from "@/lib/validation/shared";

export const studentSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required."),
  phone: z.string().trim().min(1, "Phone number is required."),
  email: optionalEmail,
  national_id: optionalText,
  address: optionalText,
  notes: optionalText,
});

export type StudentInput = z.infer<typeof studentSchema>;
