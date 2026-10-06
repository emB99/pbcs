"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, NOT_ALLOWED, requireSchool } from "@/lib/school";
import { gradeScaleSchema, saveGradesSchema } from "@/lib/validation/grades";
import type { DialogResult } from "@/lib/types";

export type GradeRowInput = { enrolment_id: string; mark: string; grade: string; comment: string };

/**
 * Saves a gradebook. Who may write what (own class subjects for teachers, the
 * term lock) is enforced by row-level security in the database; this just
 * reports it kindly.
 */
export async function saveGrades(input: {
  intake_subject_id: string;
  term_id: string | null;
  rows: GradeRowInput[];
}): Promise<DialogResult & { saved?: number }> {
  await requireSchool();

  const parsed = saveGradesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the marks." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_grades", {
    p_intake_subject_id: parsed.data.intake_subject_id,
    p_term_id: parsed.data.term_id,
    p_rows: parsed.data.rows,
  });
  if (error) {
    if (error.code === "42501") {
      return { ok: false, message: "These results are locked, or you cannot edit this class." };
    }
    return { ok: false, message: "Could not save the marks. Try again." };
  }

  revalidatePath("/teach", "layout");
  revalidatePath("/intakes", "layout");
  revalidatePath("/students", "layout");
  return { ok: true, saved: data ?? 0 };
}

export async function saveGradeScale(
  bands: { min_mark: string; grade: string; description: string; is_pass: boolean }[],
): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };

  const parsed = gradeScaleSchema.safeParse(bands);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the scale." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_grade_scale", {
    p_bands: parsed.data.map((b) => ({ ...b, min_mark: Number(b.min_mark) })),
  });
  if (error) return { ok: false, message: "Could not save the scale. Try again." };

  revalidatePath("/settings");
  return { ok: true };
}

export async function resetGradeScale(): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase.rpc("reset_grade_scale");
  if (error) return { ok: false, message: "Could not reset the scale. Try again." };

  revalidatePath("/settings");
  return { ok: true };
}
