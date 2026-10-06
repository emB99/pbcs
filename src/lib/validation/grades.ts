import { z } from "zod";

const markField = z
  .string()
  .trim()
  .refine((v) => v === "" || (/^\d{1,3}(\.\d{1,2})?$/.test(v) && Number(v) >= 0 && Number(v) <= 100), {
    message: "Marks must be between 0 and 100.",
  });

export const gradeRowSchema = z.object({
  enrolment_id: z.string().min(1),
  mark: markField,
  grade: z.string().trim().max(20),
  comment: z.string().trim().max(500),
});

export const saveGradesSchema = z.object({
  intake_subject_id: z.string().min(1),
  term_id: z.string().nullable(),
  rows: z.array(gradeRowSchema).min(1, "Nothing to save."),
});

export const gradeBandSchema = z.object({
  min_mark: z
    .string()
    .trim()
    .refine((v) => /^\d{1,3}(\.\d{1,2})?$/.test(v) && Number(v) >= 0 && Number(v) <= 100, {
      message: "Each band needs a starting mark between 0 and 100.",
    }),
  grade: z.string().trim().min(1, "Each band needs a grade label.").max(20),
  description: z.string().trim().max(60),
  is_pass: z.boolean(),
});

export const gradeScaleSchema = z
  .array(gradeBandSchema)
  .min(1, "Add at least one band.")
  .superRefine((bands, ctx) => {
    const marks = bands.map((b) => Number(b.min_mark));
    if (!marks.includes(0)) {
      ctx.addIssue({ code: "custom", message: "One band must start at 0 so every mark has a grade." });
    }
    if (new Set(marks).size !== marks.length) {
      ctx.addIssue({ code: "custom", message: "Two bands start at the same mark." });
    }
  });
