import { z } from "zod";
import { optionalText, optionalEmail } from "@/lib/validation/shared";

export const guardianSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required."),
  relationship: optionalText,
  phone: optionalText,
  email: optionalEmail,
  is_primary: z.boolean(),
  notes: optionalText,
});

export type GuardianInput = z.infer<typeof guardianSchema>;
