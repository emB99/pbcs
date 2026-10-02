import { z } from "zod";

export const setupSchema = z.object({
  name: z.string().trim().min(1, "Enter your school's name.").max(120),
  school_type: z.enum(["college", "k12"], { message: "Choose a school type." }),
  student_number_prefix: z
    .string()
    .trim()
    .max(8, "Keep the prefix to 8 characters or fewer.")
    .regex(/^[A-Za-z0-9-]*$/, "Use letters, numbers or hyphens only."),
});
