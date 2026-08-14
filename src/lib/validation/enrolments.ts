import { z } from "zod";
import { moneyInputSchema, optionalText } from "@/lib/validation/shared";

export const enrolmentSchema = z
  .object({
    mode: z.enum(["existing", "new"]),
    student_id: z.string().optional(),
    new_student_full_name: z.string().optional(),
    new_student_phone: z.string().optional(),
    intake_id: z.string().min(1, "Choose an intake."),
    agreed_price: moneyInputSchema,
    price_note: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.mode === "existing" && !data.student_id) {
      ctx.addIssue({ code: "custom", path: ["student_id"], message: "Choose a student." });
    }
    if (data.mode === "new") {
      if (!data.new_student_full_name?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["new_student_full_name"],
          message: "Full name is required.",
        });
      }
      if (!data.new_student_phone?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["new_student_phone"],
          message: "Phone is required.",
        });
      }
    }
  });

export type EnrolmentInput = z.infer<typeof enrolmentSchema>;

export const withdrawSchema = z.object({
  choice: z.enum(["write_off", "keep_owing"]),
});
